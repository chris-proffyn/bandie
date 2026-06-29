import { slugifyBandName } from '@bandie/utils';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import {
  formatSongDuration,
  listBandSongs,
  type SongReadinessStatus,
  type SongWithReadiness,
} from './songs';

export type SetlistStatus =
  | 'draft'
  | 'needs_rehearsal'
  | 'needs_specific_part'
  | 'gig_ready'
  | 'archived';

export const SETLIST_STATUS_OPTIONS: SetlistStatus[] = [
  'draft',
  'needs_rehearsal',
  'needs_specific_part',
  'gig_ready',
  'archived',
];

export const SETLIST_VIBE_PRESETS = [
  'Rock',
  'Jazz',
  'Punk',
  'Post-punk',
  'Funk',
  'Soul',
  'Acoustic',
  'High energy',
  'New wave',
  'Indie',
] as const;

export const SETLIST_LEADER_ONLY_MESSAGE =
  'Only band leaders can create or edit setlists. You can view setlists and running orders.';

export type BandSetlist = {
  id: string;
  band_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: SetlistStatus;
  vibe: string | null;
  notes: string | null;
  times_used: number;
  last_used_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type SetlistItem = {
  id: string;
  band_id: string;
  setlist_id: string;
  song_id: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type SetlistItemWithSong = SetlistItem & {
  song: SongWithReadiness | null;
};

export type SetlistMetrics = {
  songCount: number;
  totalDurationSeconds: number;
  readinessPercent: number;
  notGigReadyCount: number;
};

export type SetlistWithDetails = BandSetlist & {
  items: SetlistItemWithSong[];
  metrics: SetlistMetrics;
};

export type SetlistLibraryEntry = BandSetlist & {
  metrics: SetlistMetrics;
  previewItems: SetlistItemWithSong[];
};

export type SetlistLibraryMetrics = {
  activeCount: number;
  gigReadyCount: number;
  mostUsedTitle: string | null;
  mostUsedCount: number;
  longestDurationSeconds: number;
  longestSetlistTitle: string | null;
};

export type SetlistListFilters = {
  search?: string;
  status?: 'all' | SetlistStatus | 'recently_used';
  sort?: 'recent' | 'title' | 'used' | 'duration';
  includeArchived?: boolean;
};

export type CreateSetlistInput = {
  bandId: string;
  title: string;
  description?: string;
  status?: SetlistStatus;
  vibe?: string;
  notes?: string;
};

export type UpdateSetlistInput = {
  title?: string;
  description?: string | null;
  status?: SetlistStatus;
  vibe?: string | null;
  notes?: string | null;
};

function mapSetlistRow(row: Record<string, unknown>): BandSetlist {
  return row as BandSetlist;
}

function mapSetlistItemRow(row: Record<string, unknown>): SetlistItem {
  return row as SetlistItem;
}

function isSongGigReady(song: Pick<SongWithReadiness, 'readiness_status' | 'readinessPercent'>): boolean {
  return song.readiness_status === 'ready' || song.readinessPercent >= 100;
}

export function formatSetlistStatus(status: SetlistStatus): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'needs_rehearsal':
      return 'Needs rehearsal';
    case 'needs_specific_part':
      return 'Needs specific part';
    case 'gig_ready':
      return 'Gig ready';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}

export function setlistStatusPillClass(status: SetlistStatus): string {
  switch (status) {
    case 'gig_ready':
      return 'setlists-pill green';
    case 'needs_rehearsal':
    case 'needs_specific_part':
      return 'setlists-pill amber';
    case 'archived':
      return 'setlists-pill slate';
    case 'draft':
    default:
      return 'setlists-pill blue';
  }
}

export function formatSetlistLastUsed(lastUsedAt: string | null | undefined): string {
  if (!lastUsedAt) {
    return 'Never';
  }

  const date = new Date(lastUsedAt);
  if (Number.isNaN(date.getTime())) {
    return 'Never';
  }

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function isSetlistRecentlyUsed(lastUsedAt: string | null | undefined): boolean {
  if (!lastUsedAt) {
    return false;
  }

  const usedAt = Date.parse(lastUsedAt);
  if (Number.isNaN(usedAt)) {
    return false;
  }

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return usedAt >= thirtyDaysAgo;
}

export function formatSetlistDuration(seconds: number): string {
  if (!seconds || seconds <= 0) {
    return '0m';
  }

  const minutes = Math.round(seconds / 60);
  return `${minutes}m`;
}

export function computeSetlistMetrics(items: SetlistItemWithSong[]): SetlistMetrics {
  const activeItems = items.filter((item) => item.song && !item.song.is_deleted);
  const songCount = activeItems.length;

  if (songCount === 0) {
    return {
      songCount: 0,
      totalDurationSeconds: 0,
      readinessPercent: 0,
      notGigReadyCount: 0,
    };
  }

  const totalDurationSeconds = activeItems.reduce(
    (sum, item) => sum + (item.song?.duration_seconds ?? 0),
    0,
  );
  const readinessPercent = Math.round(
    activeItems.reduce((sum, item) => sum + (item.song?.readinessPercent ?? 0), 0) / songCount,
  );
  const notGigReadyCount = activeItems.filter((item) => item.song && !isSongGigReady(item.song)).length;

  return {
    songCount,
    totalDurationSeconds,
    readinessPercent,
    notGigReadyCount,
  };
}

export function computeSetlistLibraryMetrics(entries: SetlistLibraryEntry[]): SetlistLibraryMetrics {
  const active = entries.filter((entry) => entry.status !== 'archived');
  const gigReadyCount = active.filter((entry) => entry.status === 'gig_ready').length;

  let mostUsedTitle: string | null = null;
  let mostUsedCount = 0;
  let longestDurationSeconds = 0;
  let longestSetlistTitle: string | null = null;

  for (const entry of active) {
    if (entry.times_used > mostUsedCount) {
      mostUsedCount = entry.times_used;
      mostUsedTitle = entry.title;
    }

    if (entry.metrics.totalDurationSeconds > longestDurationSeconds) {
      longestDurationSeconds = entry.metrics.totalDurationSeconds;
      longestSetlistTitle = entry.title;
    }
  }

  return {
    activeCount: active.length,
    gigReadyCount,
    mostUsedTitle,
    mostUsedCount,
    longestDurationSeconds,
    longestSetlistTitle,
  };
}

export function suggestSetlistStatus(metrics: SetlistMetrics, currentStatus: SetlistStatus): SetlistStatus {
  if (currentStatus === 'archived') {
    return 'archived';
  }

  if (metrics.songCount === 0) {
    return 'draft';
  }

  if (metrics.notGigReadyCount > 0) {
    return metrics.readinessPercent < 50 ? 'needs_rehearsal' : 'needs_specific_part';
  }

  return 'gig_ready';
}

function applySetlistFilters(entries: SetlistLibraryEntry[], filters: SetlistListFilters): SetlistLibraryEntry[] {
  let rows = [...entries];
  const search = filters.search?.trim().toLowerCase();

  if (!filters.includeArchived) {
    rows = rows.filter((entry) => entry.status !== 'archived');
  }

  if (search) {
    rows = rows.filter((entry) => {
      const haystack = [entry.title, entry.description, entry.notes, entry.vibe]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'recently_used') {
      rows = rows.filter((entry) => isSetlistRecentlyUsed(entry.last_used_at));
    } else {
      rows = rows.filter((entry) => entry.status === filters.status);
    }
  }

  switch (filters.sort) {
    case 'title':
      rows.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'used':
      rows.sort(
        (a, b) => b.times_used - a.times_used || a.title.localeCompare(b.title),
      );
      break;
    case 'duration':
      rows.sort(
        (a, b) =>
          b.metrics.totalDurationSeconds - a.metrics.totalDurationSeconds ||
          a.title.localeCompare(b.title),
      );
      break;
    case 'recent':
    default:
      rows.sort(
        (a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at) || a.title.localeCompare(b.title),
      );
      break;
  }

  return rows;
}

async function resolveUniqueSetlistSlug(
  bandId: string,
  title: string,
  excludeSetlistId?: string,
): Promise<string> {
  const client = getBandieClient();
  const base = slugifyBandName(title) || 'setlist';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await client
      .from('bandie_setlists')
      .select('id')
      .eq('band_id', bandId)
      .eq('slug', candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.id === excludeSetlistId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function loadSongLookup(bandId: string): Promise<Map<string, SongWithReadiness>> {
  const songs = await listBandSongs(bandId, { sort: 'title' });
  return new Map(songs.filter((song) => !song.is_deleted).map((song) => [song.id, song]));
}

function attachSongsToItems(
  items: SetlistItem[],
  songLookup: Map<string, SongWithReadiness>,
): SetlistItemWithSong[] {
  return items
    .map((item) => ({
      ...item,
      song: songLookup.get(item.song_id) ?? null,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
}

export async function listBandSetlists(
  bandId: string,
  filters: SetlistListFilters = {},
): Promise<SetlistLibraryEntry[]> {
  const client = getBandieClient();

  const { data: setlistRows, error: setlistError } = await client
    .from('bandie_setlists')
    .select('*')
    .eq('band_id', bandId)
    .order('updated_at', { ascending: false });

  if (setlistError) {
    throw new Error(setlistError.message);
  }

  const setlists = (setlistRows ?? []).map((row) => mapSetlistRow(row as Record<string, unknown>));
  if (setlists.length === 0) {
    return [];
  }

  const setlistIds = setlists.map((setlist) => setlist.id);
  const { data: itemRows, error: itemError } = await client
    .from('bandie_setlist_items')
    .select('*')
    .in('setlist_id', setlistIds)
    .order('sort_order', { ascending: true });

  if (itemError) {
    throw new Error(itemError.message);
  }

  const items = (itemRows ?? []).map((row) => mapSetlistItemRow(row as Record<string, unknown>));
  const songLookup = await loadSongLookup(bandId);
  const itemsBySetlist = new Map<string, SetlistItemWithSong[]>();

  for (const setlist of setlists) {
    const setlistItems = items.filter((item) => item.setlist_id === setlist.id);
    itemsBySetlist.set(setlist.id, attachSongsToItems(setlistItems, songLookup));
  }

  const entries = setlists.map((setlist) => {
    const setlistItems = itemsBySetlist.get(setlist.id) ?? [];
    const metrics = computeSetlistMetrics(setlistItems);
    return {
      ...setlist,
      metrics,
      previewItems: setlistItems.slice(0, 4),
    };
  });

  return applySetlistFilters(entries, filters);
}

export async function getBandSetlist(bandId: string, setlistId: string): Promise<SetlistWithDetails | null> {
  const client = getBandieClient();

  const { data: setlistRow, error: setlistError } = await client
    .from('bandie_setlists')
    .select('*')
    .eq('band_id', bandId)
    .eq('id', setlistId)
    .maybeSingle();

  if (setlistError) {
    throw new Error(setlistError.message);
  }

  if (!setlistRow) {
    return null;
  }

  const { data: itemRows, error: itemError } = await client
    .from('bandie_setlist_items')
    .select('*')
    .eq('setlist_id', setlistId)
    .order('sort_order', { ascending: true });

  if (itemError) {
    throw new Error(itemError.message);
  }

  const items = (itemRows ?? []).map((row) => mapSetlistItemRow(row as Record<string, unknown>));
  const songLookup = await loadSongLookup(bandId);
  const itemsWithSongs = attachSongsToItems(items, songLookup);
  const setlist = mapSetlistRow(setlistRow as Record<string, unknown>);

  return {
    ...setlist,
    items: itemsWithSongs,
    metrics: computeSetlistMetrics(itemsWithSongs),
  };
}

export async function createBandSetlist(input: CreateSetlistInput): Promise<BandSetlist> {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error('You must be signed in to create a setlist.');
  }

  const client = getBandieClient();
  const title = input.title.trim();
  if (!title) {
    throw new Error('Setlist title is required.');
  }

  const slug = await resolveUniqueSetlistSlug(input.bandId, title);

  const { data, error } = await client
    .from('bandie_setlists')
    .insert({
      band_id: input.bandId,
      title,
      slug,
      description: input.description?.trim() || null,
      status: input.status ?? 'draft',
      vibe: input.vibe?.trim() || null,
      notes: input.notes?.trim() || null,
      created_by: session.user.id,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSetlistRow(data as Record<string, unknown>);
}

export async function updateBandSetlist(
  bandId: string,
  setlistId: string,
  input: UpdateSetlistInput,
): Promise<BandSetlist> {
  const client = getBandieClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new Error('Setlist title is required.');
    }
    updates.title = title;
    updates.slug = await resolveUniqueSetlistSlug(bandId, title, setlistId);
  }

  if (input.description !== undefined) {
    updates.description = input.description?.trim() || null;
  }

  if (input.status !== undefined) {
    updates.status = input.status;
  }

  if (input.vibe !== undefined) {
    updates.vibe = input.vibe?.trim() || null;
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes?.trim() || null;
  }

  const { data, error } = await client
    .from('bandie_setlists')
    .update(updates)
    .eq('band_id', bandId)
    .eq('id', setlistId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSetlistRow(data as Record<string, unknown>);
}

export async function duplicateBandSetlist(bandId: string, setlistId: string): Promise<BandSetlist> {
  const source = await getBandSetlist(bandId, setlistId);
  if (!source) {
    throw new Error('Setlist not found.');
  }

  const duplicate = await createBandSetlist({
    bandId,
    title: `${source.title} copy`,
    description: source.description ?? undefined,
    status: 'draft',
    vibe: source.vibe ?? undefined,
    notes: source.notes ?? undefined,
  });

  for (const item of source.items) {
    await addSetlistItem(bandId, duplicate.id, item.song_id, item.notes ?? undefined);
  }

  return duplicate;
}

export async function deleteBandSetlist(bandId: string, setlistId: string): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.from('bandie_setlists').delete().eq('band_id', bandId).eq('id', setlistId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function archiveBandSetlist(bandId: string, setlistId: string): Promise<BandSetlist> {
  return updateBandSetlist(bandId, setlistId, { status: 'archived' });
}

export async function addSetlistItem(
  bandId: string,
  setlistId: string,
  songId: string,
  notes?: string,
): Promise<SetlistItem> {
  const client = getBandieClient();

  const { data: existingItems, error: existingError } = await client
    .from('bandie_setlist_items')
    .select('sort_order')
    .eq('setlist_id', setlistId)
    .order('sort_order', { ascending: false })
    .limit(1);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const nextSortOrder =
    existingItems && existingItems.length > 0 ? Number(existingItems[0].sort_order) + 1 : 0;

  const { data, error } = await client
    .from('bandie_setlist_items')
    .insert({
      band_id: bandId,
      setlist_id: setlistId,
      song_id: songId,
      sort_order: nextSortOrder,
      notes: notes?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSetlistItemRow(data as Record<string, unknown>);
}

export async function removeSetlistItem(
  bandId: string,
  setlistId: string,
  itemId: string,
): Promise<void> {
  const client = getBandieClient();
  const { error } = await client
    .from('bandie_setlist_items')
    .delete()
    .eq('band_id', bandId)
    .eq('setlist_id', setlistId)
    .eq('id', itemId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSetlistItemNotes(
  bandId: string,
  setlistId: string,
  itemId: string,
  notes: string | null,
): Promise<SetlistItem> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_setlist_items')
    .update({
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('band_id', bandId)
    .eq('setlist_id', setlistId)
    .eq('id', itemId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSetlistItemRow(data as Record<string, unknown>);
}

export async function reorderSetlistItems(
  bandId: string,
  setlistId: string,
  orderedItemIds: string[],
): Promise<void> {
  const client = getBandieClient();

  for (let index = 0; index < orderedItemIds.length; index += 1) {
    const itemId = orderedItemIds[index];
    const { error } = await client
      .from('bandie_setlist_items')
      .update({
        sort_order: index,
        updated_at: new Date().toISOString(),
      })
      .eq('band_id', bandId)
      .eq('setlist_id', setlistId)
      .eq('id', itemId);

    if (error) {
      throw new Error(error.message);
    }
  }

  await client
    .from('bandie_setlists')
    .update({ updated_at: new Date().toISOString() })
    .eq('band_id', bandId)
    .eq('id', setlistId);
}

export async function recordSetlistUsage(bandId: string, setlistId: string): Promise<BandSetlist> {
  const client = getBandieClient();
  const current = await getBandSetlist(bandId, setlistId);
  if (!current) {
    throw new Error('Setlist not found.');
  }

  const { data, error } = await client
    .from('bandie_setlists')
    .update({
      times_used: current.times_used + 1,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('band_id', bandId)
    .eq('id', setlistId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapSetlistRow(data as Record<string, unknown>);
}

export function formatSetlistSongMeta(song: SongWithReadiness): string {
  const parts = [
    song.genre ?? undefined,
    formatSongDuration(song.duration_seconds),
    song.song_key ?? undefined,
  ].filter(Boolean);
  return parts.join(' · ');
}

export function formatSongReadinessLabel(status: SongReadinessStatus, readinessPercent: number): string {
  if (status === 'ready' || readinessPercent >= 100) {
    return 'Gig ready';
  }
  if (status === 'needs_review') {
    return 'Needs review';
  }
  if (status === 'in_progress') {
    return 'In progress';
  }
  return 'Needs rehearsal';
}
