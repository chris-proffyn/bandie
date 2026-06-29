import type { Handler, HandlerEvent } from '@netlify/functions';
import { downloadDropboxFile, getDropboxTemporaryLink } from './lib/dropbox';
import { binaryResponse, errorResponse, jsonResponse } from './lib/http';
import {
  assertDropboxPathUnderRoot,
  loadActiveBandSongPartStorage,
  logSongPartActivity,
  SONG_PART_UPLOAD_MAX_BYTES,
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
    const inline = event.queryStringParameters?.inline === '1';

    if (!bandId || !fileId) {
      return errorResponse('bandId and fileId are required.', 400);
    }

    const isMember = await userIsBandMember(user.id, bandId);
    if (!isMember) {
      return errorResponse('Only approved band members can preview song-part files.', 403);
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

    if (inline) {
      const fileSize = file.file_size_bytes ?? 0;
      if (fileSize > SONG_PART_UPLOAD_MAX_BYTES) {
        return errorResponse(
          'This file is too large for in-app preview. Use Download or Open in new tab.',
          413,
        );
      }

      const content = await downloadDropboxFile(accessToken, file.dropbox_path_lower);

      await logSongPartActivity(admin, {
        bandId,
        songId: file.song_id,
        songPartFolderId: file.song_part_folder_id,
        fileId: file.id,
        actorUserId: user.id,
        action: 'file_previewed',
        metadata: { displayName: file.display_name, inline: true },
      });

      return binaryResponse(content, file.mime_type || 'application/pdf', {
        disposition: 'inline',
        filename: file.display_name,
      });
    }

    const previewUrl = await getDropboxTemporaryLink(accessToken, file.dropbox_path_lower);

    await logSongPartActivity(admin, {
      bandId,
      songId: file.song_id,
      songPartFolderId: file.song_part_folder_id,
      fileId: file.id,
      actorUserId: user.id,
      action: 'file_previewed',
      metadata: { displayName: file.display_name },
    });

    return jsonResponse({
      previewUrl,
      displayName: file.display_name,
      mimeType: file.mime_type,
    });
  } catch (err) {
    console.error('song-part-file-preview failed', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Unable to preview song-part file.',
      500,
    );
  }
};
