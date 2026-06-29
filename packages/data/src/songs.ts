import { slugifyBandName } from '@bandie/utils';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import {
  type SongPartFile,
  type SongPartFileActivity,
  type SongPartFolder,
  type SongPartFolderWithStats,
} from './songParts';
import {
  ensureBandSongPartTemplates,
  templateRowsForSongFolders,
} from './songPartTemplates';

export type SongReadinessStatus = 'not_started' | 'in_progress' | 'ready' | 'needs_review';

export type BandSong = {
  id: string;
  band_id: string;
  title: string;
  slug: string;
  artist: string | null;
  genre: string | null;
  song_key: string | null;
  duration_seconds: number | null;
  readiness_status: SongReadinessStatus;
  times_played: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
};

export type SongWithReadiness = BandSong & {
  partsComplete: number;
  partsRequired: number;
  readinessPercent: number;
};

export type SongDashboardMetrics = {
  totalSongs: number;
  gigReadyCount: number;
  missingPartsCount: number;
  songsAddedThisMonth: number;
  repertoireReadinessPercent: number;
};

export type SongListFilters = {
  search?: string;
  genre?: string;
  readiness?: 'all' | 'gig_ready' | 'not_started' | 'in_progress' | 'ready' | 'needs_review';
  key?: string;
  sort?: 'title' | 'recent' | 'played' | 'readiness';
  includeDeleted?: boolean;
};

export type CreateSongInput = {
  bandId: string;
  title: string;
  artist?: string;
  genre?: string;
  songKey?: string;
  durationSeconds?: number;
  notes?: string;
};

export type UpdateSongInput = {
  title?: string;
  artist?: string | null;
  genre?: string | null;
  songKey?: string | null;
  durationSeconds?: number | null;
  readinessStatus?: SongReadinessStatus;
  notes?: string | null;
};

type PartFolderRow = Pick<
  SongPartFolder,
  'id' | 'song_id' | 'part_key' | 'required_for_readiness'
>;

type PartFileRow = Pick<SongPartFile, 'song_part_folder_id' | 'status'>;

function mapSongRow(row: Record<string, unknown>): BandSong {
  return row as BandSong;
}

export function formatSongDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds <= 0) {
    return '—';
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}

export function songTitleInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function formatSongReadinessStatus(status: SongReadinessStatus): string {
  switch (status) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'ready':
      return 'Gig ready';
    case 'needs_review':
      return 'Needs review';
    default:
      return status;
  }
}

export function computeSongReadiness(
  folders: PartFolderRow[],
  files: PartFileRow[],
): { partsComplete: number; partsRequired: number; readinessPercent: number } {
  const requiredFolders = folders.filter((folder) => folder.required_for_readiness);
  const partsRequired = requiredFolders.length;

  if (partsRequired === 0) {
    return { partsComplete: 0, partsRequired: 0, readinessPercent: 0 };
  }

  const currentFilesByFolder = new Set(
    files
      .filter((file) => file.status === 'current')
      .map((file) => file.song_part_folder_id),
  );

  const partsComplete = requiredFolders.filter((folder) => currentFilesByFolder.has(folder.id)).length;
  const readinessPercent = Math.round((partsComplete / partsRequired) * 100);

  return { partsComplete, partsRequired, readinessPercent };
}

export function deriveReadinessStatusFromPercent(
  percent: number,
  currentStatus: SongReadinessStatus,
): SongReadinessStatus {
  if (currentStatus === 'needs_review') {
    return 'needs_review';
  }

  if (percent >= 100) {
    return 'ready';
  }

  if (percent > 0) {
    return 'in_progress';
  }

  return 'not_started';
}

function attachReadiness(
  songs: BandSong[],
  folders: PartFolderRow[],
  files: PartFileRow[],
): SongWithReadiness[] {
  const foldersBySong = new Map<string, PartFolderRow[]>();
  for (const folder of folders) {
    const rows = foldersBySong.get(folder.song_id) ?? [];
    rows.push(folder);
    foldersBySong.set(folder.song_id, rows);
  }

  const filesBySongFolder = new Map<string, PartFileRow[]>();
  for (const file of files) {
    const rows = filesBySongFolder.get(file.song_part_folder_id) ?? [];
    rows.push(file);
    filesBySongFolder.set(file.song_part_folder_id, rows);
  }

  return songs.map((song) => {
    const songFolders = foldersBySong.get(song.id) ?? [];
    const songFiles = songFolders.flatMap((folder) => filesBySongFolder.get(folder.id) ?? []);
    const readiness = computeSongReadiness(songFolders, songFiles);

    return {
      ...song,
      ...readiness,
    };
  });
}

function applySongFilters(songs: SongWithReadiness[], filters: SongListFilters): SongWithReadiness[] {
  let rows = [...songs];
  const search = filters.search?.trim().toLowerCase();

  if (search) {
    rows = rows.filter((song) => {
      const haystack = [song.title, song.artist, song.notes, song.genre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  if (filters.genre && filters.genre !== 'all') {
    rows = rows.filter((song) => (song.genre ?? '').toLowerCase() === filters.genre!.toLowerCase());
  }

  if (filters.key && filters.key !== 'all') {
    rows = rows.filter((song) => (song.song_key ?? '').toLowerCase() === filters.key!.toLowerCase());
  }

  if (filters.readiness && filters.readiness !== 'all') {
    if (filters.readiness === 'gig_ready') {
      rows = rows.filter(
        (song) => song.readiness_status === 'ready' || song.readinessPercent >= 100,
      );
    } else {
      rows = rows.filter((song) => song.readiness_status === filters.readiness);
    }
  }

  switch (filters.sort) {
    case 'title':
      rows.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'played':
      rows.sort((a, b) => b.times_played - a.times_played || a.title.localeCompare(b.title));
      break;
    case 'readiness':
      rows.sort(
        (a, b) => b.readinessPercent - a.readinessPercent || a.title.localeCompare(b.title),
      );
      break;
    case 'recent':
    default:
      rows.sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.title.localeCompare(b.title),
      );
      break;
  }

  return rows;
}

export function computeSongDashboardMetrics(songs: SongWithReadiness[]): SongDashboardMetrics {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalSongs = songs.length;
  const gigReadyCount = songs.filter(
    (song) => song.readiness_status === 'ready' || song.readinessPercent >= 100,
  ).length;
  const missingPartsCount = songs.filter(
    (song) => song.partsRequired > 0 && song.partsComplete < song.partsRequired,
  ).length;
  const songsAddedThisMonth = songs.filter(
    (song) => Date.parse(song.created_at) >= monthStart.getTime(),
  ).length;

  const repertoireReadinessPercent =
    totalSongs === 0
      ? 0
      : Math.round(
          songs.reduce((sum, song) => sum + song.readinessPercent, 0) / totalSongs,
        );

  return {
    totalSongs,
    gigReadyCount,
    missingPartsCount,
    songsAddedThisMonth,
    repertoireReadinessPercent,
  };
}

export function collectSongGenres(songs: BandSong[]): string[] {
  const genres = new Set<string>();
  for (const song of songs) {
    if (song.genre?.trim()) {
      genres.add(song.genre.trim());
    }
  }
  return [...genres].sort((a, b) => a.localeCompare(b));
}

export function collectSongKeys(songs: BandSong[]): string[] {
  const keys = new Set<string>();
  for (const song of songs) {
    if (song.song_key?.trim()) {
      keys.add(song.song_key.trim());
    }
  }
  return [...keys].sort((a, b) => a.localeCompare(b));
}

async function resolveUniqueSongSlug(
  bandId: string,
  title: string,
  excludeSongId?: string,
): Promise<string> {
  const client = getBandieClient();
  const base = slugifyBandName(title) || 'song';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await client
      .from('bandie_songs')
      .select('id')
      .eq('band_id', bandId)
      .eq('slug', candidate)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.id === excludeSongId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function createDefaultPartFolders(bandId: string, songId: string): Promise<void> {
  const client = getBandieClient();
  const templates = await ensureBandSongPartTemplates(bandId);
  const rows = templateRowsForSongFolders(templates, bandId, songId);

  const { error } = await client.from('bandie_song_part_folders').insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

async function resolveUniqueSongPartKey(
  bandId: string,
  songId: string,
  label: string,
  excludeFolderId?: string,
): Promise<string> {
  const client = getBandieClient();
  const base = slugifyBandName(label) || 'part';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await client
      .from('bandie_song_part_folders')
      .select('id')
      .eq('band_id', bandId)
      .eq('song_id', songId)
      .eq('part_key', candidate)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.id === excludeFolderId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function recalculateSongReadiness(bandId: string, songId: string): Promise<void> {
  const client = getBandieClient();
  const [{ data: folders }, { data: files }, { data: song }] = await Promise.all([
    client
      .from('bandie_song_part_folders')
      .select('id, required_for_readiness')
      .eq('band_id', bandId)
      .eq('song_id', songId),
    client
      .from('bandie_song_part_files')
      .select('song_part_folder_id, status')
      .eq('band_id', bandId)
      .eq('song_id', songId),
    client
      .from('bandie_songs')
      .select('readiness_status')
      .eq('band_id', bandId)
      .eq('id', songId)
      .maybeSingle(),
  ]);

  if (!song) {
    return;
  }

  const readiness = computeSongReadiness(
    (folders ?? []) as PartFolderRow[],
    (files ?? []) as PartFileRow[],
  );

  let readinessStatus = song.readiness_status as SongReadinessStatus;
  if (readinessStatus !== 'needs_review') {
    if (readiness.readinessPercent >= 100) {
      readinessStatus = 'ready';
    } else if (readiness.readinessPercent > 0) {
      readinessStatus = 'in_progress';
    } else {
      readinessStatus = 'not_started';
    }
  }

  await client
    .from('bandie_songs')
    .update({
      readiness_status: readinessStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', songId);
}

export type CreateSongPartFolderInput = {
  bandId: string;
  songId: string;
  partLabel: string;
  requiredForReadiness?: boolean;
};

export async function createSongPartFolder(input: CreateSongPartFolderInput): Promise<SongPartFolder> {
  const label = input.partLabel.trim();
  if (!label) {
    throw new Error('Part label is required.');
  }

  const client = getBandieClient();
  const { data: existing } = await client
    .from('bandie_song_part_folders')
    .select('sort_order')
    .eq('band_id', input.bandId)
    .eq('song_id', input.songId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSort = ((existing?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  const partKey = await resolveUniqueSongPartKey(input.bandId, input.songId, label);

  const { data, error } = await client
    .from('bandie_song_part_folders')
    .insert({
      band_id: input.bandId,
      song_id: input.songId,
      part_key: partKey,
      part_label: label,
      sort_order: nextSort,
      required_for_readiness: input.requiredForReadiness ?? true,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await recalculateSongReadiness(input.bandId, input.songId);
  return data as SongPartFolder;
}

export type UpdateSongPartFolderInput = {
  partLabel?: string;
  requiredForReadiness?: boolean;
};

export async function updateSongPartFolder(
  bandId: string,
  songId: string,
  folderId: string,
  input: UpdateSongPartFolderInput,
): Promise<SongPartFolder> {
  const client = getBandieClient();
  const updates: Record<string, unknown> = {};

  if (input.partLabel !== undefined) {
    const label = input.partLabel.trim();
    if (!label) {
      throw new Error('Part label cannot be empty.');
    }
    updates.part_label = label;
  }

  if (input.requiredForReadiness !== undefined) {
    updates.required_for_readiness = input.requiredForReadiness;
  }

  if (Object.keys(updates).length === 0) {
    const { data } = await client
      .from('bandie_song_part_folders')
      .select('*')
      .eq('id', folderId)
      .maybeSingle();
    if (!data) {
      throw new Error('Song part folder not found.');
    }
    return data as SongPartFolder;
  }

  const { data, error } = await client
    .from('bandie_song_part_folders')
    .update(updates)
    .eq('band_id', bandId)
    .eq('song_id', songId)
    .eq('id', folderId)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await recalculateSongReadiness(bandId, songId);
  return data as SongPartFolder;
}

export async function deleteSongPartFolder(
  bandId: string,
  songId: string,
  folderId: string,
): Promise<void> {
  const client = getBandieClient();
  const { count, error: countError } = await client
    .from('bandie_song_part_files')
    .select('id', { count: 'exact', head: true })
    .eq('song_part_folder_id', folderId);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error('Remove or reassign files before deleting this part folder.');
  }

  const { error } = await client
    .from('bandie_song_part_folders')
    .delete()
    .eq('band_id', bandId)
    .eq('song_id', songId)
    .eq('id', folderId);

  if (error) {
    throw new Error(error.message);
  }

  await recalculateSongReadiness(bandId, songId);
}

export async function applyBandTemplatesToSong(bandId: string, songId: string): Promise<void> {
  const client = getBandieClient();
  const templates = await ensureBandSongPartTemplates(bandId);
  const { data: folders, error: foldersError } = await client
    .from('bandie_song_part_folders')
    .select('id, part_key')
    .eq('band_id', bandId)
    .eq('song_id', songId);

  if (foldersError) {
    throw new Error(foldersError.message);
  }

  const existingKeys = new Set((folders ?? []).map((folder) => folder.part_key as string));
  const missing = templates.filter((template) => !existingKeys.has(template.part_key));

  if (missing.length === 0) {
    return;
  }

  const rows = missing.map((template) => ({
    band_id: bandId,
    song_id: songId,
    part_key: template.part_key,
    part_label: template.part_label,
    sort_order: template.sort_order,
    required_for_readiness: template.required_for_readiness,
  }));

  const { error } = await client.from('bandie_song_part_folders').insert(rows);
  if (error) {
    throw new Error(error.message);
  }

  await recalculateSongReadiness(bandId, songId);
}

async function loadReadinessContext(bandId: string, songIds: string[]) {
  if (songIds.length === 0) {
    return { folders: [] as PartFolderRow[], files: [] as PartFileRow[] };
  }

  const client = getBandieClient();
  const [folderResult, fileResult] = await Promise.all([
    client
      .from('bandie_song_part_folders')
      .select('id, song_id, part_key, required_for_readiness')
      .eq('band_id', bandId)
      .in('song_id', songIds),
    client
      .from('bandie_song_part_files')
      .select('song_part_folder_id, status')
      .eq('band_id', bandId)
      .in('song_id', songIds),
  ]);

  if (folderResult.error) {
    throw new Error(folderResult.error.message);
  }

  if (fileResult.error) {
    throw new Error(fileResult.error.message);
  }

  return {
    folders: (folderResult.data ?? []) as PartFolderRow[],
    files: (fileResult.data ?? []) as PartFileRow[],
  };
}

export async function listBandSongs(
  bandId: string,
  filters: SongListFilters = {},
): Promise<SongWithReadiness[]> {
  const client = getBandieClient();
  let query = client.from('bandie_songs').select('*').eq('band_id', bandId);

  if (!filters.includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const songs = (data ?? []).map((row) => mapSongRow(row as Record<string, unknown>));
  const { folders, files } = await loadReadinessContext(
    bandId,
    songs.map((song) => song.id),
  );

  return applySongFilters(attachReadiness(songs, folders, files), filters);
}

export async function getBandSongDashboardMetrics(bandId: string): Promise<SongDashboardMetrics> {
  const songs = await listBandSongs(bandId);
  return computeSongDashboardMetrics(songs);
}

export async function getBandSong(
  bandId: string,
  songId: string,
  options: { includeDeleted?: boolean } = {},
): Promise<SongWithReadiness | null> {
  const client = getBandieClient();
  let query = client.from('bandie_songs').select('*').eq('band_id', bandId).eq('id', songId);

  if (!options.includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const song = mapSongRow(data as Record<string, unknown>);
  const { folders, files } = await loadReadinessContext(bandId, [song.id]);
  return attachReadiness([song], folders, files)[0] ?? null;
}

export async function createBandSong(input: CreateSongInput): Promise<SongWithReadiness> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Sign in to add songs.');
  }

  const title = input.title.trim();
  if (!title) {
    throw new Error('Song title is required.');
  }

  const slug = await resolveUniqueSongSlug(input.bandId, title);
  const payload = {
    band_id: input.bandId,
    title,
    slug,
    artist: input.artist?.trim() || null,
    genre: input.genre?.trim() || null,
    song_key: input.songKey?.trim() || null,
    duration_seconds: input.durationSeconds ?? null,
    notes: input.notes?.trim() || null,
    created_by: user.id,
  };

  const { data, error } = await client.from('bandie_songs').insert(payload).select('*').single();
  if (error) {
    throw new Error(error.message);
  }

  await createDefaultPartFolders(input.bandId, data.id);
  const created = await getBandSong(input.bandId, data.id);
  if (!created) {
    throw new Error('Song was created but could not be loaded.');
  }

  return created;
}

export async function updateBandSong(
  bandId: string,
  songId: string,
  input: UpdateSongInput,
): Promise<SongWithReadiness> {
  const client = getBandieClient();
  const existingSong = await getBandSong(bandId, songId, { includeDeleted: true });
  if (!existingSong) {
    throw new Error('Song not found.');
  }

  if (existingSong.is_deleted) {
    throw new Error('This song has been deleted. Restore it before editing.');
  }

  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) {
      throw new Error('Song title cannot be empty.');
    }
    updates.title = title;
    updates.slug = await resolveUniqueSongSlug(bandId, title, songId);
  }

  if (input.artist !== undefined) updates.artist = input.artist?.trim() || null;
  if (input.genre !== undefined) updates.genre = input.genre?.trim() || null;
  if (input.songKey !== undefined) updates.song_key = input.songKey?.trim() || null;
  if (input.durationSeconds !== undefined) updates.duration_seconds = input.durationSeconds;
  if (input.readinessStatus !== undefined) updates.readiness_status = input.readinessStatus;
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;

  if (Object.keys(updates).length === 0) {
    const existing = await getBandSong(bandId, songId);
    if (!existing) {
      throw new Error('Song not found.');
    }
    return existing;
  }

  const { error } = await client
    .from('bandie_songs')
    .update(updates)
    .eq('band_id', bandId)
    .eq('id', songId);

  if (error) {
    throw new Error(error.message);
  }

  const updated = await getBandSong(bandId, songId);
  if (!updated) {
    throw new Error('Song not found after update.');
  }

  return updated;
}

export async function softDeleteBandSong(bandId: string, songId: string): Promise<void> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_songs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('band_id', bandId)
    .eq('id', songId)
    .eq('is_deleted', false)
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Song not found or already deleted.');
  }
}

export async function restoreBandSong(bandId: string, songId: string): Promise<SongWithReadiness> {
  const client = getBandieClient();
  const song = await getBandSong(bandId, songId, { includeDeleted: true });
  if (!song) {
    throw new Error('Song not found.');
  }

  if (!song.is_deleted) {
    return song;
  }

  const slug = await resolveUniqueSongSlug(bandId, song.title, songId);
  const { data, error } = await client
    .from('bandie_songs')
    .update({
      is_deleted: false,
      deleted_at: null,
      slug,
    })
    .eq('band_id', bandId)
    .eq('id', songId)
    .eq('is_deleted', true)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Unable to restore song.');
  }

  const restored = await getBandSong(bandId, songId);
  if (!restored) {
    throw new Error('Song was restored but could not be loaded.');
  }

  return restored;
}

export async function listSongPartFolders(
  bandId: string,
  songId: string,
): Promise<SongPartFolderWithStats[]> {
  const client = getBandieClient();
  const [folderResult, fileResult] = await Promise.all([
    client
      .from('bandie_song_part_folders')
      .select('*')
      .eq('band_id', bandId)
      .eq('song_id', songId)
      .order('sort_order', { ascending: true }),
    client
      .from('bandie_song_part_files')
      .select('song_part_folder_id, status')
      .eq('band_id', bandId)
      .eq('song_id', songId),
  ]);

  if (folderResult.error) {
    throw new Error(folderResult.error.message);
  }

  if (fileResult.error) {
    throw new Error(fileResult.error.message);
  }

  const files = (fileResult.data ?? []) as PartFileRow[];
  const currentCountByFolder = new Map<string, number>();

  for (const file of files) {
    if (file.status !== 'current') {
      continue;
    }
    currentCountByFolder.set(
      file.song_part_folder_id,
      (currentCountByFolder.get(file.song_part_folder_id) ?? 0) + 1,
    );
  }

  return ((folderResult.data ?? []) as SongPartFolder[]).map((folder) => {
    const currentFileCount = currentCountByFolder.get(folder.id) ?? 0;
    return {
      ...folder,
      currentFileCount,
      hasCurrentFile: currentFileCount > 0,
    };
  });
}

export async function listSongPartFiles(
  bandId: string,
  songId: string,
): Promise<SongPartFile[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_part_files')
    .select('*')
    .eq('band_id', bandId)
    .eq('song_id', songId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SongPartFile[];
}

export async function listRecentSongPartActivity(
  bandId: string,
  limit = 8,
): Promise<SongPartFileActivity[]> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_song_part_file_activity')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SongPartFileActivity[];
}

export type UploadSongPartFileInput = {
  bandId: string;
  songId: string;
  partFolderId: string;
  fileName: string;
  mimeType: string;
  contentBase64: string;
  status?: 'current' | 'draft' | 'reference';
};

const SONG_PART_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

async function parseSongPartApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  if (!contentType.includes('application/json')) {
    if (body.trimStart().startsWith('<!')) {
      throw new Error(
        'Song-part API is unavailable. Start the app with npm run dev (Netlify on port 8888) or use a Netlify deploy.',
      );
    }
    throw new Error('Unexpected response from song-part API.');
  }

  return JSON.parse(body) as T;
}

export async function uploadSongPartFile(input: UploadSongPartFileInput): Promise<SongPartFile> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to upload song-part files.');
  }

  const binaryLength = Math.ceil((input.contentBase64.length * 3) / 4);
  if (binaryLength > SONG_PART_UPLOAD_MAX_BYTES) {
    throw new Error('This file is larger than the 4 MB upload limit for song-part files on web.');
  }

  const response = await fetch('/api/bands/song-part-files/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await parseSongPartApiJson<{ file?: SongPartFile; error?: string }>(response);
  if (!response.ok || !payload.file) {
    throw new Error(payload.error ?? 'Unable to upload song-part file.');
  }

  return payload.file;
}

export function formatSongPartActivityLabel(activity: SongPartFileActivity): string {
  const metadata = activity.metadata ?? {};
  const displayName =
    typeof metadata.displayName === 'string' ? metadata.displayName : undefined;
  const partLabel = typeof metadata.partLabel === 'string' ? metadata.partLabel : undefined;

  switch (activity.action) {
    case 'file_uploaded':
      return displayName
        ? `${partLabel ? `${partLabel} sheet uploaded — ` : ''}${displayName}`
        : 'Song-part file uploaded';
    case 'file_previewed':
      return displayName ? `Previewed ${displayName}` : 'File previewed';
    case 'file_downloaded':
      return displayName ? `Downloaded ${displayName}` : 'File downloaded';
    case 'song_created':
      return typeof metadata.title === 'string' ? `New song: ${metadata.title}` : 'New song added';
    default:
      return activity.action.replaceAll('_', ' ');
  }
}

export async function getSongPartFilePreviewUrl(
  bandId: string,
  fileId: string,
): Promise<{ previewUrl: string; displayName: string; mimeType: string | null }> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to preview song-part files.');
  }

  const response = await fetch(
    `/api/bands/song-part-files/preview?bandId=${encodeURIComponent(bandId)}&fileId=${encodeURIComponent(fileId)}`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  const payload = await parseSongPartApiJson<{
    previewUrl?: string;
    displayName?: string;
    mimeType?: string | null;
    error?: string;
  }>(response);

  if (!response.ok || !payload.previewUrl) {
    throw new Error(payload.error ?? 'Unable to preview song-part file.');
  }

  return {
    previewUrl: payload.previewUrl,
    displayName: payload.displayName ?? 'File',
    mimeType: payload.mimeType ?? null,
  };
}

export async function loadSongPartFileInlinePreview(
  bandId: string,
  fileId: string,
): Promise<{ blobUrl: string; displayName: string; mimeType: string | null }> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to preview song-part files.');
  }

  const response = await fetch(
    `/api/bands/song-part-files/preview?bandId=${encodeURIComponent(bandId)}&fileId=${encodeURIComponent(fileId)}&inline=1`,
    {
      method: 'GET',
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  const contentType = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { error?: string };
      throw new Error(payload.error ?? 'Unable to preview song-part file.');
    }

    throw new Error('Unable to preview song-part file.');
  }

  const blob = await response.blob();
  const mimeType = blob.type || contentType || 'application/pdf';
  const blobUrl = URL.createObjectURL(blob);

  const disposition = response.headers.get('content-disposition') ?? '';
  const filenameMatch = disposition.match(/filename="([^"]+)"/i);
  const displayName = filenameMatch?.[1] ?? 'File';

  return {
    blobUrl,
    displayName,
    mimeType,
  };
}

export function getSongPartFileDownloadUrl(bandId: string, fileId: string): string {
  return `/api/bands/song-part-files/download?bandId=${encodeURIComponent(bandId)}&fileId=${encodeURIComponent(fileId)}`;
}

export async function downloadSongPartFile(bandId: string, fileId: string, displayName: string): Promise<void> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to download song-part files.');
  }

  const response = await fetch(getSongPartFileDownloadUrl(bandId, fileId), {
    method: 'GET',
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  const payload = await parseSongPartApiJson<{
    downloadUrl?: string;
    error?: string;
  }>(response);

  if (!response.ok || !payload.downloadUrl) {
    throw new Error(payload.error ?? 'Unable to download song-part file.');
  }

  const anchor = document.createElement('a');
  anchor.href = payload.downloadUrl;
  anchor.download = displayName;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.click();
}

export function formatActivityTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (sameDay) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function computeReadinessSnapshots(songs: SongWithReadiness[]) {
  const missingVocals = songs.filter((song) => song.partsRequired > 0 && song.partsComplete < song.partsRequired).length;
  const gigReady = songs.filter((song) => song.readiness_status === 'ready' || song.readinessPercent >= 100);

  const totalDurationSeconds = gigReady.reduce((sum, song) => sum + (song.duration_seconds ?? 0), 0);
  const totalMinutes = Math.round(totalDurationSeconds / 60);

  return {
    gigReadyCount: gigReady.length,
    totalPlayableMinutes: totalMinutes,
    missingPartsCount: missingVocals,
  };
}
