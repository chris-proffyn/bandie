import type { SupabaseClient } from '@supabase/supabase-js';
import {
  bandSongFolderPath,
  bandSongPartFolderPath,
  bandSongPartsRootPath,
  copyDropboxPath,
  createDropboxFolder,
} from './dropbox';
import { loadDropboxAccessToken } from './dropboxTokens';
import {
  assertDropboxPathUnderRoot,
  loadActiveBandSongPartStorage,
  logSongPartActivity,
  recalculateSongReadiness,
} from './songPartsServer';

function slugifySongTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

type BandRow = { id: string; slug: string };
type SongRow = {
  id: string;
  title: string;
  slug: string;
  artist: string | null;
  genre: string | null;
  song_key: string | null;
  duration_seconds: number | null;
  notes: string | null;
  readiness_status: string;
  is_deleted: boolean;
};
type PartFolderRow = {
  id: string;
  part_key: string;
  part_label: string;
  sort_order: number;
  required_for_readiness: boolean;
  dropbox_folder_id: string | null;
  dropbox_path_lower: string | null;
};
type PartFileRow = {
  id: string;
  song_part_folder_id: string;
  display_name: string;
  mime_type: string | null;
  file_size_bytes: number | null;
  dropbox_file_id: string | null;
  dropbox_path_lower: string | null;
  dropbox_rev: string | null;
  dropbox_content_hash: string | null;
  status: string;
  version_label: string | null;
  visibility: string;
};

export type CopySongToBandInput = {
  sourceBandId: string;
  sourceSongId: string;
  targetBandId: string;
  title?: string;
};

export type CopySongToBandResult = {
  songId: string;
  targetBandId: string;
  copiedFolders: number;
  copiedFiles: number;
};

async function resolveUniqueSongSlug(
  admin: SupabaseClient,
  bandId: string,
  title: string,
): Promise<string> {
  const base = slugifySongTitle(title) || 'song';
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await admin
      .from('bandie_songs')
      .select('id')
      .eq('band_id', bandId)
      .eq('slug', candidate)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function resolveUniqueSongTitle(
  admin: SupabaseClient,
  bandId: string,
  desiredTitle: string,
): Promise<string> {
  const base = desiredTitle.trim();
  let candidate = base;
  let suffix = 2;

  while (true) {
    const { data, error } = await admin
      .from('bandie_songs')
      .select('id')
      .eq('band_id', bandId)
      .eq('title', candidate)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidate;
    }

    candidate = suffix === 2 ? `${base} (copy)` : `${base} (copy ${suffix - 1})`;
    suffix += 1;
  }
}

async function loadSourceBandSongPartStorage(
  admin: SupabaseClient,
  bandId: string,
): Promise<{ integrationId: string; rootFolderPath: string } | null> {
  const { data, error } = await admin
    .from('bandie_band_song_part_storage')
    .select('integration_id, root_folder_path, status')
    .eq('band_id', bandId)
    .eq('provider', 'dropbox')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.status !== 'active') {
    return null;
  }

  return {
    integrationId: data.integration_id as string,
    rootFolderPath: data.root_folder_path as string,
  };
}

export async function copySongToBandServer(
  admin: SupabaseClient,
  actorUserId: string,
  input: CopySongToBandInput,
): Promise<CopySongToBandResult> {
  const sourceBandId = input.sourceBandId.trim();
  const sourceSongId = input.sourceSongId.trim();
  const targetBandId = input.targetBandId.trim();

  if (!sourceBandId || !sourceSongId || !targetBandId) {
    throw new Error('Source band, source song, and target band are required.');
  }

  if (sourceBandId === targetBandId) {
    throw new Error('Choose a different band to copy this song into.');
  }

  const [{ data: sourceBand }, { data: targetBand }, { data: sourceSong }] = await Promise.all([
    admin.from('bandie_bands').select('id, slug').eq('id', sourceBandId).maybeSingle(),
    admin.from('bandie_bands').select('id, slug').eq('id', targetBandId).maybeSingle(),
    admin
      .from('bandie_songs')
      .select(
        'id, title, slug, artist, genre, song_key, duration_seconds, notes, readiness_status, is_deleted',
      )
      .eq('band_id', sourceBandId)
      .eq('id', sourceSongId)
      .maybeSingle(),
  ]);

  if (!sourceBand?.slug || !targetBand?.slug || !sourceSong) {
    throw new Error('Song or band not found.');
  }

  if (sourceSong.is_deleted) {
    throw new Error('Restore the source song before copying it to another band.');
  }

  const { storage: targetStorage, integration: targetIntegration } =
    await loadActiveBandSongPartStorage(admin, targetBandId);

  const sourceStorage = await loadSourceBandSongPartStorage(admin, sourceBandId);
  if (
    sourceStorage &&
    sourceStorage.integrationId !== targetStorage.integration_id
  ) {
    throw new Error(
      'Both bands must use the same Dropbox account for song-part storage. Connect the same Dropbox account on each band before copying files.',
    );
  }

  const sourceRootPath =
    sourceStorage?.rootFolderPath ?? bandSongPartsRootPath(sourceBand.slug as string);

  const requestedTitle = input.title?.trim() || (sourceSong.title as string);
  const title = await resolveUniqueSongTitle(admin, targetBandId, requestedTitle);
  const slug = await resolveUniqueSongSlug(admin, targetBandId, title);
  const now = new Date().toISOString();

  const { data: createdSong, error: songError } = await admin
    .from('bandie_songs')
    .insert({
      band_id: targetBandId,
      title,
      slug,
      artist: sourceSong.artist,
      genre: sourceSong.genre,
      song_key: sourceSong.song_key,
      duration_seconds: sourceSong.duration_seconds,
      notes: sourceSong.notes,
      readiness_status: 'not_started',
      times_played: 0,
      created_by: actorUserId,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();

  if (songError || !createdSong) {
    throw new Error(songError?.message ?? 'Unable to create copied song.');
  }

  const targetSongId = createdSong.id as string;

  const [{ data: sourceFolders }, { data: sourceFiles }] = await Promise.all([
    admin
      .from('bandie_song_part_folders')
      .select(
        'id, part_key, part_label, sort_order, required_for_readiness, dropbox_folder_id, dropbox_path_lower',
      )
      .eq('band_id', sourceBandId)
      .eq('song_id', sourceSongId)
      .order('sort_order'),
    admin
      .from('bandie_song_part_files')
      .select(
        'id, song_part_folder_id, display_name, mime_type, file_size_bytes, dropbox_file_id, dropbox_path_lower, dropbox_rev, dropbox_content_hash, status, version_label, visibility',
      )
      .eq('band_id', sourceBandId)
      .eq('song_id', sourceSongId),
  ]);

  const folders = (sourceFolders ?? []) as PartFolderRow[];
  const files = (sourceFiles ?? []) as PartFileRow[];
  const filesByFolder = new Map<string, PartFileRow[]>();

  for (const file of files) {
    const rows = filesByFolder.get(file.song_part_folder_id) ?? [];
    rows.push(file);
    filesByFolder.set(file.song_part_folder_id, rows);
  }

  const accessToken = await loadDropboxAccessToken(admin, targetIntegration);
  const sourceBandRow = sourceBand as BandRow;
  const targetBandRow = targetBand as BandRow;
  const sourceSongRow = sourceSong as SongRow;

  let copiedFolders = 0;
  let copiedFiles = 0;

  await createDropboxFolder(accessToken, bandSongFolderPath(targetBandRow.slug, slug));

  for (const sourceFolder of folders) {
    const { data: targetFolder, error: folderError } = await admin
      .from('bandie_song_part_folders')
      .insert({
        band_id: targetBandId,
        song_id: targetSongId,
        part_key: sourceFolder.part_key,
        part_label: sourceFolder.part_label,
        sort_order: sourceFolder.sort_order,
        required_for_readiness: sourceFolder.required_for_readiness,
      })
      .select('id, part_key')
      .single();

    if (folderError || !targetFolder) {
      throw new Error(folderError?.message ?? 'Unable to create copied part folder.');
    }

    copiedFolders += 1;

    const destPartPath = bandSongPartFolderPath(
      targetBandRow.slug,
      slug,
      targetFolder.part_key as string,
    );
    const partMetadata = await createDropboxFolder(accessToken, destPartPath);
    assertDropboxPathUnderRoot(partMetadata.path_lower, targetStorage.root_folder_path);

    await admin
      .from('bandie_song_part_folders')
      .update({
        dropbox_folder_id: partMetadata.id,
        dropbox_path_lower: partMetadata.path_lower,
        updated_at: now,
      })
      .eq('id', targetFolder.id);

    const folderFiles = filesByFolder.get(sourceFolder.id) ?? [];

    for (const sourceFile of folderFiles) {
      if (!sourceFile.dropbox_path_lower || sourceFile.status === 'unavailable') {
        continue;
      }

      assertDropboxPathUnderRoot(sourceFile.dropbox_path_lower, sourceRootPath);

      const fileName =
        sourceFile.display_name.trim() ||
        sourceFile.dropbox_path_lower.split('/').pop() ||
        'file';
      const destFilePath = `${destPartPath}/${fileName}`;
      const copied = await copyDropboxPath(
        accessToken,
        sourceFile.dropbox_path_lower,
        destFilePath,
      );
      assertDropboxPathUnderRoot(copied.path_lower, targetStorage.root_folder_path);

      const { error: fileError } = await admin.from('bandie_song_part_files').insert({
        band_id: targetBandId,
        song_id: targetSongId,
        song_part_folder_id: targetFolder.id,
        storage_id: targetStorage.id,
        source: 'dropbox',
        provider: 'dropbox',
        display_name: fileName,
        mime_type: sourceFile.mime_type,
        file_size_bytes: sourceFile.file_size_bytes,
        dropbox_file_id: copied.id,
        dropbox_path_lower: copied.path_lower,
        dropbox_rev: copied.rev,
        dropbox_content_hash: copied.content_hash ?? sourceFile.dropbox_content_hash,
        status: sourceFile.status,
        version_label: sourceFile.version_label,
        visibility: sourceFile.visibility,
        added_by_user_id: actorUserId,
        created_at: now,
        updated_at: now,
      });

      if (fileError) {
        throw new Error(fileError.message);
      }

      copiedFiles += 1;
    }
  }

  await recalculateSongReadiness(admin, targetBandId, targetSongId);

  await logSongPartActivity(admin, {
    bandId: targetBandId,
    songId: targetSongId,
    actorUserId,
    action: 'song_copied',
    metadata: {
      sourceBandId,
      sourceSongId,
      sourceSongTitle: sourceSongRow.title,
      sourceBandSlug: sourceBandRow.slug,
      targetBandSlug: targetBandRow.slug,
      copiedFolders,
      copiedFiles,
    },
  });

  return {
    songId: targetSongId,
    targetBandId,
    copiedFolders,
    copiedFiles,
  };
}
