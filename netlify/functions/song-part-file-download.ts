import type { Handler, HandlerEvent } from '@netlify/functions';
import { getDropboxTemporaryLink } from './lib/dropbox';
import { errorResponse, jsonResponse } from './lib/http';
import {
  assertDropboxPathUnderRoot,
  loadActiveBandSongPartStorage,
  logSongPartActivity,
} from './lib/songPartsServer';
import { loadDropboxAccessToken } from './lib/dropboxTokens';
import { getSupabaseAdmin, getUserFromBearerToken, userIsBandMember } from './lib/supabase';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const user = await getUserFromBearerToken(
      new Request('http://localhost', { headers: event.headers as HeadersInit }),
    );

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const bandId = event.queryStringParameters?.bandId?.trim();
    const fileId = event.queryStringParameters?.fileId?.trim();

    if (!bandId || !fileId) {
      return errorResponse('bandId and fileId are required.', 400);
    }

    const isMember = await userIsBandMember(user.id, bandId);
    if (!isMember) {
      return errorResponse('Only approved band members can download song-part files.', 403);
    }

    const admin = getSupabaseAdmin();
    const { data: file, error } = await admin
      .from('bandie_song_part_files')
      .select('*')
      .eq('band_id', bandId)
      .eq('id', fileId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!file) {
      return errorResponse('File not found.', 404);
    }

    if (file.status === 'unavailable' || !file.dropbox_path_lower) {
      return errorResponse('This file is currently unavailable. Dropbox may need reconnecting.', 409);
    }

    const { storage, integration } = await loadActiveBandSongPartStorage(admin, bandId);
    assertDropboxPathUnderRoot(file.dropbox_path_lower, storage.root_folder_path);

    const accessToken = await loadDropboxAccessToken(admin, integration);
    const downloadUrl = await getDropboxTemporaryLink(accessToken, file.dropbox_path_lower);

    await logSongPartActivity(admin, {
      bandId,
      songId: file.song_id,
      songPartFolderId: file.song_part_folder_id,
      fileId: file.id,
      actorUserId: user.id,
      action: 'file_downloaded',
      metadata: { displayName: file.display_name },
    });

    return jsonResponse({
      downloadUrl,
      displayName: file.display_name,
      mimeType: file.mime_type,
    });
  } catch (err) {
    console.error('song-part-file-download failed', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Unable to download song-part file.',
      500,
    );
  }
};
