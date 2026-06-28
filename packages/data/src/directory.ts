import { availabilityLabel, formatBandDirectorySubtitle, formatFeeRange } from './bandProfile';
import { getBandieClient } from './context';
import {
  DEFAULT_DIRECTORY_AREA_FILTERS,
  matchesAreaFilter,
  type DirectoryAreaFilters,
  type GeographyIndex,
} from './geography';
import { filterTestRows, includeTestData } from './testDataMode';

export type DirectoryBandListing = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  country_id: string | null;
  region_id: string | null;
  travel_distance_miles: number | null;
  genres: string[];
  tagline: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  fee_guidance_min: number | null;
  fee_guidance_max: number | null;
  availability_status: 'available' | 'limited' | 'unavailable';
  band_size: number | null;
  created_at: string;
};

export type DirectoryAvailabilityFilter = 'available' | 'limited' | 'unavailable' | '';

export type DirectoryFilters = DirectoryAreaFilters & {
  name: string;
  genre: string;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  availability: DirectoryAvailabilityFilter;
};

export type DirectorySort = 'recommended' | 'priceAsc' | 'priceDesc' | 'nameAsc';

export const DEFAULT_DIRECTORY_FILTERS: DirectoryFilters = {
  ...DEFAULT_DIRECTORY_AREA_FILTERS,
  name: '',
  genre: '',
  location: '',
  minPrice: null,
  maxPrice: null,
  availability: '',
};

const directorySelect = `
  id,
  name,
  slug,
  description,
  location,
  country_id,
  region_id,
  travel_distance_miles,
  genres,
  tagline,
  logo_url,
  hero_image_url,
  fee_guidance_min,
  fee_guidance_max,
  availability_status,
  band_size,
  created_at,
  test_user
`;

export async function listPublishedBandsForDirectory(): Promise<DirectoryBandListing[]> {
  const client = getBandieClient();
  let query = client
    .from('bandie_bands')
    .select(directorySelect)
    .eq('public_profile_enabled', true);

  if (!includeTestData()) {
    query = query.eq('test_user', false);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return filterTestRows(data ?? []).map(({ test_user: _testUser, ...band }) => ({
    ...band,
    genres: band.genres ?? [],
  }));
}

function availabilityRank(status: DirectoryBandListing['availability_status']): number {
  switch (status) {
    case 'available':
      return 3;
    case 'limited':
      return 2;
    case 'unavailable':
      return 1;
    default:
      return 0;
  }
}

function profileCompletenessScore(band: DirectoryBandListing): number {
  let score = 0;
  if (band.description?.trim()) score += 1;
  if (band.logo_url) score += 1;
  if (band.fee_guidance_min != null || band.fee_guidance_max != null) score += 1;
  if (band.genres.length) score += 1;
  return score;
}

function priceOverlaps(
  band: DirectoryBandListing,
  minPrice: number | null,
  maxPrice: number | null,
): boolean {
  const hasPriceFilter = (minPrice ?? 0) > 0 || maxPrice != null;
  if (!hasPriceFilter) {
    return true;
  }

  if (band.fee_guidance_min == null && band.fee_guidance_max == null) {
    return true;
  }

  const bandMin = band.fee_guidance_min ?? 0;
  const bandMax = band.fee_guidance_max ?? bandMin;
  const filterMin = minPrice ?? 0;
  const filterMax = maxPrice ?? Number.POSITIVE_INFINITY;

  return bandMax >= filterMin && bandMin <= filterMax;
}

function matchesGenre(band: DirectoryBandListing, genre: string): boolean {
  if (!genre) {
    return true;
  }

  const needle = genre.toLowerCase();
  return band.genres.some((item) => item.toLowerCase() === needle || item.toLowerCase().includes(needle));
}

export function filterDirectoryBands(
  bands: DirectoryBandListing[],
  filters: DirectoryFilters,
  geography?: GeographyIndex,
): DirectoryBandListing[] {
  const nameNeedle = filters.name.trim().toLowerCase();
  const locationNeedle = filters.location.trim().toLowerCase();

  return bands.filter((band) => {
    if (geography && !matchesAreaFilter(band, filters, geography)) {
      return false;
    }

    const searchableText = [
      band.name,
      band.location,
      band.tagline,
      band.description,
      ...band.genres,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (nameNeedle && !band.name.toLowerCase().includes(nameNeedle)) {
      return false;
    }

    if (locationNeedle && !searchableText.includes(locationNeedle)) {
      return false;
    }

    if (!matchesGenre(band, filters.genre)) {
      return false;
    }

    if (filters.availability && band.availability_status !== filters.availability) {
      return false;
    }

    return priceOverlaps(band, filters.minPrice, filters.maxPrice);
  });
}

export function sortDirectoryBands(
  bands: DirectoryBandListing[],
  sort: DirectorySort,
): DirectoryBandListing[] {
  const sorted = [...bands];

  switch (sort) {
    case 'priceAsc':
      sorted.sort(
        (a, b) =>
          (a.fee_guidance_min ?? Number.POSITIVE_INFINITY) -
            (b.fee_guidance_min ?? Number.POSITIVE_INFINITY) ||
          a.name.localeCompare(b.name),
      );
      break;
    case 'priceDesc':
      sorted.sort(
        (a, b) =>
          (b.fee_guidance_max ?? b.fee_guidance_min ?? 0) -
            (a.fee_guidance_max ?? a.fee_guidance_min ?? 0) || a.name.localeCompare(b.name),
      );
      break;
    case 'nameAsc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'recommended':
    default:
      sorted.sort((a, b) => {
        const availabilityDiff = availabilityRank(b.availability_status) - availabilityRank(a.availability_status);
        if (availabilityDiff !== 0) {
          return availabilityDiff;
        }

        const completenessDiff = profileCompletenessScore(b) - profileCompletenessScore(a);
        if (completenessDiff !== 0) {
          return completenessDiff;
        }

        return a.name.localeCompare(b.name);
      });
      break;
  }

  return sorted;
}

export function collectDirectoryGenres(bands: DirectoryBandListing[]): string[] {
  const genres = new Set<string>();
  for (const band of bands) {
    for (const genre of band.genres) {
      if (genre.trim()) {
        genres.add(genre.trim());
      }
    }
  }
  return [...genres].sort((a, b) => a.localeCompare(b));
}

export function directoryBandMeta(band: DirectoryBandListing): string {
  const subtitle = formatBandDirectorySubtitle(band);
  if (subtitle) {
    return subtitle;
  }
  return band.location ?? 'Location not listed';
}

export function directoryAvailabilityBadge(status: DirectoryBandListing['availability_status']): string {
  switch (status) {
    case 'available':
      return 'Available';
    case 'limited':
      return 'Limited';
    case 'unavailable':
      return 'Unavailable';
    default:
      return availabilityLabel(status);
  }
}

export function directoryPriceLabel(band: DirectoryBandListing): string {
  return formatFeeRange(band.fee_guidance_min, band.fee_guidance_max) ?? 'Price on request';
}

export function directoryBandTags(band: DirectoryBandListing): string[] {
  const tags = [...band.genres];
  if (band.band_size) {
    tags.push(`${band.band_size}-piece`);
  }
  return tags.slice(0, 4);
}

export type DirectoryStats = {
  bandCount: number;
  genreCount: number;
  lowestFee: number | null;
};

export function computeDirectoryStats(bands: DirectoryBandListing[]): DirectoryStats {
  const genres = collectDirectoryGenres(bands);
  const fees = bands
    .map((band) => band.fee_guidance_min)
    .filter((value): value is number => value != null);

  return {
    bandCount: bands.length,
    genreCount: genres.length,
    lowestFee: fees.length ? Math.min(...fees) : null,
  };
}
