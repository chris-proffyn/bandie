import { formatFeeRange } from './bandProfile';
import { getBandieClient } from './context';
import { filterTestRows, includeTestData, isHiddenTestRow } from './testDataMode';

export type PlayerSearchMode = 'temporary' | 'permanent' | 'any';

export type PlayerDirectoryListing = {
  id: string;
  display_name: string | null;
  preferred_instrument: string | null;
  profile_image_url: string | null;
  bio: string | null;
  location: string | null;
  genres: string[];
  instruments: string[];
  years_playing: number | null;
  travel_distance_miles: number | null;
  deputy_fee_guidance_min: number | null;
  deputy_fee_guidance_max: number | null;
  open_to_deputy_invites: boolean;
  open_to_member_invites: boolean;
  created_at: string;
};

export type PlayerDirectoryFilters = {
  mode: PlayerSearchMode;
  name: string;
  instrument: string;
  genre: string;
  location: string;
  gigDate: string;
  budgetMin: number | null;
  budgetMax: number | null;
  maxTravelMiles: number | null;
  minYearsPlaying: number | null;
};

export type PlayerDirectorySort = 'recommended' | 'nameAsc' | 'experienceDesc' | 'feeAsc';

export const DEFAULT_PLAYER_DIRECTORY_FILTERS: PlayerDirectoryFilters = {
  mode: 'temporary',
  name: '',
  instrument: '',
  genre: '',
  location: '',
  gigDate: '',
  budgetMin: null,
  budgetMax: null,
  maxTravelMiles: null,
  minYearsPlaying: null,
};

const playerDirectorySelect = `
  id,
  display_name,
  preferred_instrument,
  profile_image_url,
  bio,
  location,
  genres,
  instruments,
  years_playing,
  travel_distance_miles,
  deputy_fee_guidance_min,
  deputy_fee_guidance_max,
  open_to_deputy_invites,
  open_to_member_invites,
  created_at,
  test_user
`;

export async function listPublishedPlayersForDirectory(): Promise<PlayerDirectoryListing[]> {
  const client = getBandieClient();
  let query = client
    .from('bandie_profiles')
    .select(playerDirectorySelect)
    .eq('public_player_profile_enabled', true)
    .or('open_to_deputy_invites.eq.true,open_to_member_invites.eq.true');

  if (!includeTestData()) {
    query = query.eq('test_user', false);
  }

  const { data, error } = await query.order('display_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return filterTestRows(data ?? []).map(({ test_user: _testUser, ...row }) => ({
    ...row,
    genres: row.genres ?? [],
    instruments: row.instruments ?? [],
  }));
}

export async function getPublicPlayerProfileById(
  profileId: string,
): Promise<PlayerDirectoryListing | null> {
  const client = getBandieClient();
  let query = client
    .from('bandie_profiles')
    .select(playerDirectorySelect)
    .eq('id', profileId)
    .eq('public_player_profile_enabled', true);

  if (!includeTestData()) {
    query = query.eq('test_user', false);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || isHiddenTestRow(data.test_user)) {
    return null;
  }

  const { test_user: _testUser, ...row } = data;

  return {
    ...row,
    genres: row.genres ?? [],
    instruments: row.instruments ?? [],
  };
}

function playerDisplayName(player: PlayerDirectoryListing): string {
  return player.display_name?.trim() || 'Unnamed player';
}

function matchesInstrument(player: PlayerDirectoryListing, instrument: string): boolean {
  if (!instrument.trim()) {
    return true;
  }

  const needle = instrument.trim().toLowerCase();
  const primary = player.preferred_instrument?.toLowerCase() ?? '';
  if (primary.includes(needle) || needle.includes(primary)) {
    return true;
  }

  return player.instruments.some(
    (item) => item.toLowerCase().includes(needle) || needle.includes(item.toLowerCase()),
  );
}

function matchesGenre(player: PlayerDirectoryListing, genre: string): boolean {
  if (!genre.trim()) {
    return true;
  }

  const needle = genre.trim().toLowerCase();
  return player.genres.some(
    (item) => item.toLowerCase() === needle || item.toLowerCase().includes(needle),
  );
}

function feeOverlaps(
  player: PlayerDirectoryListing,
  minPrice: number | null,
  maxPrice: number | null,
): boolean {
  const hasPriceFilter = (minPrice ?? 0) > 0 || maxPrice != null;
  if (!hasPriceFilter) {
    return true;
  }

  if (player.deputy_fee_guidance_min == null && player.deputy_fee_guidance_max == null) {
    return true;
  }

  const playerMin = player.deputy_fee_guidance_min ?? 0;
  const playerMax = player.deputy_fee_guidance_max ?? playerMin;
  const filterMin = minPrice ?? 0;
  const filterMax = maxPrice ?? Number.POSITIVE_INFINITY;

  return playerMax >= filterMin && playerMin <= filterMax;
}

function matchesTravelDistance(player: PlayerDirectoryListing, maxTravelMiles: number | null): boolean {
  if (maxTravelMiles == null || maxTravelMiles <= 0) {
    return true;
  }

  if (player.travel_distance_miles == null) {
    return true;
  }

  return player.travel_distance_miles >= maxTravelMiles;
}

function matchesYearsPlaying(player: PlayerDirectoryListing, minYears: number | null): boolean {
  if (minYears == null || minYears <= 0) {
    return true;
  }

  if (player.years_playing == null) {
    return true;
  }

  return player.years_playing >= minYears;
}

function matchesMode(player: PlayerDirectoryListing, mode: PlayerSearchMode): boolean {
  if (mode === 'any') {
    return player.open_to_deputy_invites || player.open_to_member_invites;
  }
  if (mode === 'temporary') {
    return player.open_to_deputy_invites;
  }
  return player.open_to_member_invites;
}

function profileCompletenessScore(player: PlayerDirectoryListing): number {
  let score = 0;
  if (player.bio?.trim()) score += 1;
  if (player.profile_image_url) score += 1;
  if (player.preferred_instrument?.trim()) score += 1;
  if (player.genres.length) score += 1;
  if (player.instruments.length) score += 1;
  if (player.location?.trim()) score += 1;
  return score;
}

export function filterPlayerDirectory(
  players: PlayerDirectoryListing[],
  filters: PlayerDirectoryFilters,
): PlayerDirectoryListing[] {
  const nameNeedle = filters.name.trim().toLowerCase();
  const locationNeedle = filters.location.trim().toLowerCase();

  return players.filter((player) => {
    if (!matchesMode(player, filters.mode)) {
      return false;
    }

    const displayName = playerDisplayName(player).toLowerCase();
    const searchableText = [
      player.display_name,
      player.preferred_instrument,
      player.location,
      player.bio,
      ...player.genres,
      ...player.instruments,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (nameNeedle && !displayName.includes(nameNeedle)) {
      return false;
    }

    if (locationNeedle && !searchableText.includes(locationNeedle)) {
      return false;
    }

    if (!matchesInstrument(player, filters.instrument)) {
      return false;
    }

    if (!matchesGenre(player, filters.genre)) {
      return false;
    }

    if (filters.mode === 'temporary' || filters.mode === 'any') {
      if (!feeOverlaps(player, filters.budgetMin, filters.budgetMax)) {
        return false;
      }
      if (!matchesTravelDistance(player, filters.maxTravelMiles)) {
        return false;
      }
    }

    if (filters.mode === 'permanent' || filters.mode === 'any') {
      if (!matchesYearsPlaying(player, filters.minYearsPlaying)) {
        return false;
      }
    }

    return true;
  });
}

export function sortPlayerDirectory(
  players: PlayerDirectoryListing[],
  sort: PlayerDirectorySort,
  mode: PlayerSearchMode,
): PlayerDirectoryListing[] {
  const sorted = [...players];

  switch (sort) {
    case 'nameAsc':
      sorted.sort((a, b) => playerDisplayName(a).localeCompare(playerDisplayName(b)));
      break;
    case 'experienceDesc':
      sorted.sort(
        (a, b) =>
          (b.years_playing ?? -1) - (a.years_playing ?? -1) ||
          playerDisplayName(a).localeCompare(playerDisplayName(b)),
      );
      break;
    case 'feeAsc':
      sorted.sort(
        (a, b) =>
          (a.deputy_fee_guidance_min ?? Number.POSITIVE_INFINITY) -
            (b.deputy_fee_guidance_min ?? Number.POSITIVE_INFINITY) ||
          playerDisplayName(a).localeCompare(playerDisplayName(b)),
      );
      break;
    case 'recommended':
    default:
      sorted.sort((a, b) => {
        const completenessDiff = profileCompletenessScore(b) - profileCompletenessScore(a);
        if (completenessDiff !== 0) {
          return completenessDiff;
        }

        if (mode === 'permanent' || mode === 'any') {
          const yearsDiff = (b.years_playing ?? 0) - (a.years_playing ?? 0);
          if (yearsDiff !== 0) {
            return yearsDiff;
          }
        }

        if (mode === 'any') {
          const dualAvailabilityDiff =
            Number(b.open_to_deputy_invites && b.open_to_member_invites) -
            Number(a.open_to_deputy_invites && a.open_to_member_invites);
          if (dualAvailabilityDiff !== 0) {
            return dualAvailabilityDiff;
          }
        }

        return playerDisplayName(a).localeCompare(playerDisplayName(b));
      });
      break;
  }

  return sorted;
}

export function collectPlayerDirectoryGenres(players: PlayerDirectoryListing[]): string[] {
  const genres = new Set<string>();
  for (const player of players) {
    for (const genre of player.genres) {
      if (genre.trim()) {
        genres.add(genre.trim());
      }
    }
  }
  return [...genres].sort((a, b) => a.localeCompare(b));
}

export function collectPlayerDirectoryInstruments(players: PlayerDirectoryListing[]): string[] {
  const instruments = new Set<string>();
  for (const player of players) {
    if (player.preferred_instrument?.trim()) {
      instruments.add(player.preferred_instrument.trim());
    }
    for (const instrument of player.instruments) {
      if (instrument.trim()) {
        instruments.add(instrument.trim());
      }
    }
  }
  return [...instruments].sort((a, b) => a.localeCompare(b));
}

export function playerDirectoryMeta(player: PlayerDirectoryListing): string {
  const parts: string[] = [];
  if (player.preferred_instrument?.trim()) {
    parts.push(player.preferred_instrument.trim());
  }
  if (player.location?.trim()) {
    parts.push(player.location.trim());
  }
  return parts.join(' · ') || 'Location not listed';
}

export function playerDirectoryModeLabel(mode: PlayerSearchMode): string {
  switch (mode) {
    case 'temporary':
      return 'deputy / stand-in';
    case 'permanent':
      return 'permanent member';
    case 'any':
      return 'any role';
  }
}

export function playerDirectoryModeBadge(mode: PlayerSearchMode): string {
  if (mode === 'temporary') {
    return 'Open to deputy gigs';
  }
  if (mode === 'permanent') {
    return 'Open to join a band';
  }
  return 'Open to gigs or membership';
}

export function playerDirectoryInviteBadges(player: PlayerDirectoryListing): string[] {
  const labels: string[] = [];
  if (player.open_to_deputy_invites) {
    labels.push('Open to deputy gigs');
  }
  if (player.open_to_member_invites) {
    labels.push('Open to join a band');
  }
  return labels;
}

export function playerDirectoryTags(player: PlayerDirectoryListing): string[] {
  const tags = [...player.genres];
  for (const instrument of player.instruments) {
    if (instrument.trim() && !tags.includes(instrument.trim())) {
      tags.push(instrument.trim());
    }
  }
  return tags.slice(0, 4);
}

export function playerDirectoryFooter(
  player: PlayerDirectoryListing,
  mode: PlayerSearchMode,
): { label: string; value: string } {
  if (mode === 'temporary') {
    return {
      label: 'Deputy fee guidance',
      value:
        formatFeeRange(player.deputy_fee_guidance_min, player.deputy_fee_guidance_max) ??
        'Fee on request',
    };
  }

  if (mode === 'permanent') {
    return {
      label: 'Experience',
      value: player.years_playing != null ? `${player.years_playing} years playing` : 'Not listed',
    };
  }

  const details: string[] = [];
  if (player.open_to_member_invites) {
    details.push(
      player.years_playing != null
        ? `${player.years_playing} years playing`
        : 'Permanent membership',
    );
  }
  if (player.open_to_deputy_invites) {
    details.push(
      formatFeeRange(player.deputy_fee_guidance_min, player.deputy_fee_guidance_max) ??
        'Deputy fee on request',
    );
  }

  return {
    label: 'At a glance',
    value: details.length ? details.join(' · ') : 'See profile',
  };
}

export function formatPlayerTravelDistance(miles: number | null): string | null {
  if (miles == null || miles <= 0) {
    return null;
  }
  return `Travels up to ${miles} miles`;
}

export type PlayerDirectoryStats = {
  playerCount: number;
  genreCount: number;
  instrumentCount: number;
  deputyCount: number;
  memberCount: number;
};

export function computePlayerDirectoryStats(players: PlayerDirectoryListing[]): PlayerDirectoryStats {
  const genres = collectPlayerDirectoryGenres(players);
  const instruments = collectPlayerDirectoryInstruments(players);

  return {
    playerCount: players.length,
    genreCount: genres.length,
    instrumentCount: instruments.length,
    deputyCount: players.filter((player) => player.open_to_deputy_invites).length,
    memberCount: players.filter((player) => player.open_to_member_invites).length,
  };
}

export function resolvePlayerDisplayName(player: PlayerDirectoryListing): string {
  return playerDisplayName(player);
}

export function playerInviteSummary(player: PlayerDirectoryListing): string[] {
  const labels: string[] = [];
  if (player.open_to_deputy_invites) {
    labels.push('Deputy / stand-in gigs');
  }
  if (player.open_to_member_invites) {
    labels.push('Permanent member invites');
  }
  return labels;
}
