import { getBandieClient } from './context';

export type BandieCountry = {
  id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type BandieRegion = {
  id: string;
  country_id: string;
  code: string;
  name: string;
  search_keywords: string[];
  sort_order: number;
};

export type DirectoryAreaFilters = {
  countryCode: string;
  regionId: string;
};

export const DEFAULT_DIRECTORY_AREA_FILTERS: DirectoryAreaFilters = {
  countryCode: '',
  regionId: '',
};

export const BANDIE_DEFAULT_COUNTRY_CODE = 'GB';

export type GeographyIndex = {
  countries: BandieCountry[];
  regions: BandieRegion[];
  countryByCode: Map<string, BandieCountry>;
  countryById: Map<string, BandieCountry>;
  regionById: Map<string, BandieRegion>;
  regionsByCountryId: Map<string, BandieRegion[]>;
};

export type AreaListable = {
  location: string | null;
  country_id: string | null;
  region_id: string | null;
};

const countrySelect = 'id, code, name, sort_order';
const regionSelect = 'id, country_id, code, name, search_keywords, sort_order';

export async function listBandieCountries(): Promise<BandieCountry[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_countries')
    .select(countrySelect)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listBandieRegions(countryId?: string): Promise<BandieRegion[]> {
  const client = getBandieClient();
  let query = client.from('bandie_regions').select(regionSelect);

  if (countryId) {
    query = query.eq('country_id', countryId);
  }

  const { data, error } = await query
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    ...row,
    search_keywords: row.search_keywords ?? [],
  }));
}

export async function loadGeographyIndex(): Promise<GeographyIndex> {
  const [countries, regions] = await Promise.all([listBandieCountries(), listBandieRegions()]);
  return buildGeographyIndex(countries, regions);
}

export function buildGeographyIndex(
  countries: BandieCountry[],
  regions: BandieRegion[],
): GeographyIndex {
  const countryByCode = new Map<string, BandieCountry>();
  const countryById = new Map<string, BandieCountry>();
  const regionById = new Map<string, BandieRegion>();
  const regionsByCountryId = new Map<string, BandieRegion[]>();

  for (const country of countries) {
    countryByCode.set(country.code, country);
    countryById.set(country.id, country);
  }

  for (const region of regions) {
    regionById.set(region.id, region);
    const bucket = regionsByCountryId.get(region.country_id) ?? [];
    bucket.push(region);
    regionsByCountryId.set(region.country_id, bucket);
  }

  for (const bucket of regionsByCountryId.values()) {
    bucket.sort(
      (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
    );
  }

  return {
    countries,
    regions,
    countryByCode,
    countryById,
    regionById,
    regionsByCountryId,
  };
}

function normaliseLocationText(location: string | null | undefined): string {
  return (location ?? '').trim().toLowerCase();
}

function locationContainsKeyword(location: string, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase();
  if (!needle) {
    return false;
  }

  return location.includes(needle);
}

export function locationMatchesRegion(location: string | null | undefined, region: BandieRegion): boolean {
  const searchable = normaliseLocationText(location);
  if (!searchable) {
    return false;
  }

  if (locationContainsKeyword(searchable, region.name)) {
    return true;
  }

  return region.search_keywords.some((keyword) => locationContainsKeyword(searchable, keyword));
}

export function locationMatchesCountry(
  location: string | null | undefined,
  country: BandieCountry,
  geography: GeographyIndex,
): boolean {
  const regions = geography.regionsByCountryId.get(country.id) ?? [];
  return regions.some((region) => locationMatchesRegion(location, region));
}

export function matchesAreaFilter(
  item: AreaListable,
  filters: DirectoryAreaFilters,
  geography: GeographyIndex,
): boolean {
  const { countryCode, regionId } = filters;
  if (!countryCode && !regionId) {
    return true;
  }

  const country = countryCode ? geography.countryByCode.get(countryCode) : null;
  const region = regionId ? geography.regionById.get(regionId) : null;

  if (regionId) {
    if (!region) {
      return true;
    }

    if (item.region_id === regionId) {
      return true;
    }

    return locationMatchesRegion(item.location, region);
  }

  if (countryCode) {
    if (!country) {
      return true;
    }

    if (item.country_id === country.id) {
      return true;
    }

    return locationMatchesCountry(item.location, country, geography);
  }

  return true;
}

export function areaFilterLabel(
  filters: DirectoryAreaFilters,
  geography: GeographyIndex,
): string | null {
  const region = filters.regionId ? geography.regionById.get(filters.regionId) : null;
  if (region) {
    return region.name;
  }

  const country = filters.countryCode ? geography.countryByCode.get(filters.countryCode) : null;
  if (country) {
    return country.name;
  }

  return null;
}

const UK_TIMEZONE_PREFIXES = ['Europe/London', 'Europe/Belfast'];
const US_TIMEZONE_PREFIXES = ['America/'];
const AU_TIMEZONE_PREFIXES = ['Australia/'];

export function inferCountryCodeFromLocale(locale: string | undefined): string | null {
  if (!locale) {
    return null;
  }

  const normalised = locale.replace('_', '-').toLowerCase();
  const region = normalised.split('-')[1]?.toUpperCase();

  if (region === 'GB' || region === 'UK') {
    return 'GB';
  }
  if (region === 'IE') {
    return 'IE';
  }
  if (region === 'US') {
    return 'US';
  }
  if (region === 'AU') {
    return 'AU';
  }

  if (normalised.startsWith('en-gb')) {
    return 'GB';
  }
  if (normalised.startsWith('en-ie')) {
    return 'IE';
  }
  if (normalised.startsWith('en-us')) {
    return 'US';
  }
  if (normalised.startsWith('en-au')) {
    return 'AU';
  }

  return null;
}

export function inferCountryCodeFromTimeZone(timeZone: string | undefined): string | null {
  if (!timeZone) {
    return null;
  }

  if (UK_TIMEZONE_PREFIXES.some((prefix) => timeZone.startsWith(prefix))) {
    return 'GB';
  }
  if (timeZone === 'Europe/Dublin') {
    return 'IE';
  }
  if (US_TIMEZONE_PREFIXES.some((prefix) => timeZone.startsWith(prefix))) {
    return 'US';
  }
  if (AU_TIMEZONE_PREFIXES.some((prefix) => timeZone.startsWith(prefix))) {
    return 'AU';
  }

  return null;
}

export function inferDefaultCountryCode(options?: {
  locale?: string;
  timeZone?: string;
}): string {
  const locale = options?.locale;
  const timeZone = options?.timeZone;

  const fromTimeZone = inferCountryCodeFromTimeZone(timeZone);
  const fromLocale = inferCountryCodeFromLocale(locale);

  // UK/Ireland: prefer timezone over a misleading en-US browser locale.
  if (fromTimeZone === 'GB' || fromTimeZone === 'IE') {
    return fromTimeZone;
  }

  return fromLocale ?? fromTimeZone ?? BANDIE_DEFAULT_COUNTRY_CODE;
}

export function regionsForCountryCode(
  countryCode: string,
  geography: GeographyIndex,
): BandieRegion[] {
  const country = geography.countryByCode.get(countryCode);
  if (!country) {
    return [];
  }

  return geography.regionsByCountryId.get(country.id) ?? [];
}

export function mergeDirectoryAreaFilters<T extends DirectoryAreaFilters>(
  filters: T,
  area: Partial<DirectoryAreaFilters>,
): T {
  return {
    ...filters,
    countryCode: area.countryCode ?? filters.countryCode,
    regionId: area.regionId ?? filters.regionId,
  };
}

export function resetDirectoryAreaFilters<T extends DirectoryAreaFilters>(
  filters: T,
  defaults: DirectoryAreaFilters,
): T {
  return {
    ...filters,
    countryCode: defaults.countryCode,
    regionId: defaults.regionId,
  };
}
