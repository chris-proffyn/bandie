import type { SupabaseClient } from '@supabase/supabase-js';
import {
  bandSongFolderPath,
  bandSongPartFolderPath,
  createDropboxFolder,
  isPathUnderRoot,
} from './dropbox';
import { loadDropboxAccessToken } from './dropboxTokens';

export const SONG_PART_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ['image/', 'text/', 'audio/'];
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.guitar-pro',
  'application/x-guitar-pro',
  'application/octet-stream',
]);

export function validateSongPartMimeType(mimeType: string): boolean {
  const normalized = mimeType.toLowerCase().trim();
  if (!normalized) {
    return false;
  }

  if (ALLOWED_MIME_TYPES.has(normalized)) {
    return true;
  }

  return ALLOWED_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? 'file';
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, '-').trim();
  return cleaned || 'file';
}

type StorageRow = {
  id: string;
  integration_id: string;
  root_folder_path: string;
  status: string;
  owning_user_id: string;
};

type IntegrationRow = {
  id: string;
  token_expires_at: string | null;
  status: string;
};

type PartFolderRow = {
  id: string;
  band_id: string;
  song_id: string;
  part_key: string;
  part_label: string;
  dropbox_folder_id: string | null;
  dropbox_path_lower: string | null;
};

type SongRow = {
  id: string;
  slug: string;
  readiness_status: string;
};

export async function loadActiveBandSongPartStorage(
  admin: SupabaseClient,
  bandId: string,
): Promise<{ storage: StorageRow; integration: IntegrationRow }> {
  const { data: storage, error } = await admin
    .from('bandie_band_song_part_storage')
    .select('id, integration_id, root_folder_path, status, owning_user_id')
    .eq('band_id', bandId)
    .eq('provider', 'dropbox')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!storage || storage.status !== 'active') {
    throw new Error('Band song-part storage is not active. Ask your band leader to connect Dropbox.');
  }

  const { data: integration, error: integrationError } = await admin
    .from('bandie_user_integrations')
    .select('id, token_expires_at, status')
    .eq('id', storage.integration_id)
    .maybeSingle();

  if (integrationError) {
    throw new Error(integrationError.message);
  }

  if (!integration || integration.status !== 'connected') {
    throw new Error('Dropbox needs to be reconnected before uploading song-part files.');
  }

  return { storage, integration };
}

export async function ensureSongPartDropboxFolders(
  admin: SupabaseClient,
  storage: StorageRow,
  integration: IntegrationRow,
  bandSlug: string,
  song: SongRow,
  partFolder: PartFolderRow,
): Promise<PartFolderRow> {
  const accessToken = await loadDropboxAccessToken(admin, integration);
  const songFolderPath = bandSongFolderPath(bandSlug, song.slug);
  await createDropboxFolder(accessToken, songFolderPath);

  const partPath = bandSongPartFolderPath(bandSlug, song.slug, partFolder.part_key);
  const partMetadata = await createDropboxFolder(accessToken, partPath);
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('bandie_song_part_folders')
    .update({
      dropbox_folder_id: partMetadata.id,
      dropbox_path_lower: partMetadata.path_lower,
      updated_at: now,
    })
    .eq('id', partFolder.id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PartFolderRow;
}

export async function recalculateSongReadiness(
  admin: SupabaseClient,
  bandId: string,
  songId: string,
): Promise<void> {
  const [{ data: folders }, { data: files }, { data: song }] = await Promise.all([
    admin
      .from('bandie_song_part_folders')
      .select('id, required_for_readiness')
      .eq('band_id', bandId)
      .eq('song_id', songId),
    admin
      .from('bandie_song_part_files')
      .select('song_part_folder_id, status')
      .eq('band_id', bandId)
      .eq('song_id', songId),
    admin
      .from('bandie_songs')
      .select('readiness_status')
      .eq('band_id', bandId)
      .eq('id', songId)
      .maybeSingle(),
  ]);

  if (!song) {
    return;
  }

  const requiredFolders = (folders ?? []).filter((folder) => folder.required_for_readiness);
  const partsRequired = requiredFolders.length;
  const currentFolderIds = new Set(
    (files ?? [])
      .filter((file) => file.status === 'current')
      .map((file) => file.song_part_folder_id),
  );
  const partsComplete = requiredFolders.filter((folder) => currentFolderIds.has(folder.id)).length;
  const percent = partsRequired === 0 ? 0 : Math.round((partsComplete / partsRequired) * 100);

  let readinessStatus = song.readiness_status;
  if (readinessStatus !== 'needs_review') {
    if (percent >= 100) {
      readinessStatus = 'ready';
    } else if (percent > 0) {
      readinessStatus = 'in_progress';
    } else {
      readinessStatus = 'not_started';
    }
  }

  await admin
    .from('bandie_songs')
    .update({
      readiness_status: readinessStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', songId);
}

export async function logSongPartActivity(
  admin: SupabaseClient,
  payload: {
    bandId: string;
    songId?: string;
    songPartFolderId?: string;
    fileId?: string;
    actorUserId: string;
    action: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await admin.from('bandie_song_part_file_activity').insert({
    band_id: payload.bandId,
    song_id: payload.songId ?? null,
    song_part_folder_id: payload.songPartFolderId ?? null,
    file_id: payload.fileId ?? null,
    actor_user_id: payload.actorUserId,
    action: payload.action,
    provider: 'dropbox',
    metadata: payload.metadata ?? {},
  });
}

export function assertDropboxPathUnderRoot(pathLower: string | null | undefined, rootPath: string): void {
  if (!pathLower) {
    throw new Error('Dropbox file path is missing.');
  }

  if (!isPathUnderRoot(pathLower, rootPath.toLowerCase())) {
    throw new Error('Dropbox file is outside the configured Bandie song-parts folder.');
  }
}
