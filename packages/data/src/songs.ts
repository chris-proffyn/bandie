import { slugifyBandName } from '@bandie/utils';
import { getBandieClient } from './context';
import { getCurrentSession } from './auth';
import {
  STANDARD_SONG_PARTS,
  type SongPartFile,
  type SongPartFileActivity,
  type SongPartFolder,
  type SongPartFolderWithStats,
} from './songParts';

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
  const rows = STANDARD_SONG_PARTS.map((part) => ({
    band_id: bandId,
    song_id: songId,
    part_key: part.partKey,
    part_label: part.partLabel,
    sort_order: part.sortOrder,
    required_for_readiness: part.requiredForReadiness,
  }));

  const { error } = await client.from('bandie_song_part_folders').insert(rows);
  if (error) {
    throw new Error(error.message);
  }
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
  const { data, error } = await client
    .from('bandie_songs')
    .select('*')
    .eq('band_id', bandId)
    .order('created_at', { ascending: false });

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

export async function getBandSong(bandId: string, songId: string): Promise<SongWithReadiness | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_songs')
    .select('*')
    .eq('band_id', bandId)
    .eq('id', songId)
    .maybeSingle();

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
