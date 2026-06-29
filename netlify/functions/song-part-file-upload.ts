import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  bandSongPartFolderPath,
  uploadDropboxFile,
} from './lib/dropbox';
import { loadDropboxAccessToken } from './lib/dropboxTokens';
import { errorResponse, jsonResponse } from './lib/http';
import {
  assertDropboxPathUnderRoot,
  ensureSongPartDropboxFolders,
  loadActiveBandSongPartStorage,
  logSongPartActivity,
  recalculateSongReadiness,
  sanitizeFileName,
  SONG_PART_UPLOAD_MAX_BYTES,
  validateSongPartMimeType,
} from './lib/songPartsServer';
import { getSupabaseAdmin, getUserFromBearerToken, userOwnsBand } from './lib/supabase';

type UploadBody = {
  bandId?: string;
  songId?: string;
  partFolderId?: string;
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
  status?: 'current' | 'draft' | 'reference';
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const user = await getUserFromBearerToken(
      new Request('http://localhost', { headers: event.headers as HeadersInit }),
    );

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const body = event.body ? (JSON.parse(event.body) as UploadBody) : {};
    const bandId = body.bandId?.trim();
    const songId = body.songId?.trim();
    const partFolderId = body.partFolderId?.trim();
    const fileName = body.fileName?.trim();
    const mimeType = body.mimeType?.trim() ?? 'application/octet-stream';
    const contentBase64 = body.contentBase64?.trim();
    const status = body.status ?? 'current';

    if (!bandId || !songId || !partFolderId || !fileName || !contentBase64) {
      return errorResponse('bandId, songId, partFolderId, fileName and contentBase64 are required.', 400);
    }

    const isLeader = await userOwnsBand(user.id, bandId);
    if (!isLeader) {
      return errorResponse(
        'Only band leaders can upload song-part files. Ask your band leader to upload charts and part files for this band.',
        403,
      );
    }

    if (!validateSongPartMimeType(mimeType)) {
      return errorResponse('This file type is not supported for song-part uploads.', 400);
    }

    const content = Buffer.from(contentBase64, 'base64');
    if (content.byteLength > SONG_PART_UPLOAD_MAX_BYTES) {
      return errorResponse('This file is larger than the 4 MB upload limit for song-part files on web.', 400);
    }

    const admin = getSupabaseAdmin();
    const [{ data: band }, { data: song }, { data: partFolder }] = await Promise.all([
      admin.from('bandie_bands').select('id, slug').eq('id', bandId).maybeSingle(),
      admin.from('bandie_songs').select('id, slug, readiness_status, is_deleted').eq('band_id', bandId).eq('id', songId).maybeSingle(),
      admin
        .from('bandie_song_part_folders')
        .select('*')
        .eq('band_id', bandId)
        .eq('song_id', songId)
        .eq('id', partFolderId)
        .maybeSingle(),
    ]);

    if (!band?.slug || !song || !partFolder) {
      return errorResponse('Song or part folder not found.', 404);
    }

    if (song.is_deleted) {
      return errorResponse('This song has been deleted. Restore it before uploading files.', 409);
    }

    const { storage, integration } = await loadActiveBandSongPartStorage(admin, bandId);
    if (!partFolder.dropbox_path_lower) {
      await ensureSongPartDropboxFolders(admin, storage, integration, band.slug, song, partFolder);
    }

    const safeName = sanitizeFileName(fileName);
    const dropboxPath = `${bandSongPartFolderPath(band.slug, song.slug, partFolder.part_key)}/${safeName}`;
    const accessToken = await loadDropboxAccessToken(admin, integration);
    const uploaded = await uploadDropboxFile(accessToken, dropboxPath, content);
    assertDropboxPathUnderRoot(uploaded.path_lower, storage.root_folder_path);

    const now = new Date().toISOString();
    const { data: file, error: fileError } = await admin
      .from('bandie_song_part_files')
      .insert({
        band_id: bandId,
        song_id: songId,
        song_part_folder_id: partFolderId,
        storage_id: storage.id,
        source: 'dropbox',
        provider: 'dropbox',
        display_name: safeName,
        mime_type: mimeType,
        file_size_bytes: content.byteLength,
        dropbox_file_id: uploaded.id,
        dropbox_path_lower: uploaded.path_lower,
        dropbox_rev: uploaded.rev,
        dropbox_content_hash: uploaded.content_hash ?? null,
        status,
        visibility: 'band_members',
        added_by_user_id: user.id,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (fileError) {
      throw new Error(fileError.message);
    }

    await logSongPartActivity(admin, {
      bandId,
      songId,
      songPartFolderId: partFolderId,
      fileId: file.id,
      actorUserId: user.id,
      action: 'file_uploaded',
      metadata: {
        displayName: safeName,
        partLabel: partFolder.part_label,
        partKey: partFolder.part_key,
      },
    });

    await recalculateSongReadiness(admin, bandId, songId);

    return jsonResponse({ file });
  } catch (err) {
    console.error('song-part-file-upload failed', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Unable to upload song-part file.',
      500,
    );
  }
};
