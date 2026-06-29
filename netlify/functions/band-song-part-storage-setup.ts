import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  bandSongPartsRootPath,
  createDropboxFolder,
} from '../lib/dropbox';
import { loadDropboxAccessToken } from '../lib/dropboxTokens';
import { errorResponse, jsonResponse } from '../lib/http';
import { getSupabaseAdmin, getUserFromBearerToken, userOwnsBand } from '../lib/supabase';

type SetupBody = {
  bandId?: string;
  integrationId?: string;
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const user = await getUserFromBearerToken(new Request('http://localhost', {
      headers: event.headers as HeadersInit,
    }));

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const body = event.body ? (JSON.parse(event.body) as SetupBody) : {};
    const bandId = body.bandId?.trim();
    const integrationId = body.integrationId?.trim();

    if (!bandId || !integrationId) {
      return errorResponse('bandId and integrationId are required.', 400);
    }

    const ownsBand = await userOwnsBand(user.id, bandId);
    if (!ownsBand) {
      return errorResponse('Only band leaders can set up song-part storage.', 403);
    }

    const admin = getSupabaseAdmin();

    const { data: integration, error: integrationError } = await admin
      .from('bandie_user_integrations')
      .select('id, user_id, status, token_expires_at')
      .eq('id', integrationId)
      .eq('user_id', user.id)
      .eq('provider', 'dropbox')
      .maybeSingle();

    if (integrationError) {
      throw new Error(integrationError.message);
    }

    if (!integration || integration.status !== 'connected') {
      return errorResponse('Connect Dropbox before setting up band storage.', 400);
    }

    const { data: band, error: bandError } = await admin
      .from('bandie_bands')
      .select('id, slug')
      .eq('id', bandId)
      .maybeSingle();

    if (bandError) {
      throw new Error(bandError.message);
    }

    if (!band?.slug) {
      return errorResponse('Band not found.', 404);
    }

    const accessToken = await loadDropboxAccessToken(admin, integration);
    const rootPath = bandSongPartsRootPath(band.slug);
    const folderMetadata = await createDropboxFolder(accessToken, rootPath);

    const now = new Date().toISOString();
    const storagePayload = {
      band_id: bandId,
      provider: 'dropbox',
      integration_id: integration.id,
      owning_user_id: user.id,
      root_folder_path: folderMetadata.path_display || rootPath,
      root_folder_id: folderMetadata.id,
      status: 'active',
      last_health_check_at: now,
      updated_at: now,
    };

    const { data: storage, error: storageError } = await admin
      .from('bandie_band_song_part_storage')
      .upsert(storagePayload, { onConflict: 'band_id,provider' })
      .select('*')
      .single();

    if (storageError) {
      throw new Error(storageError.message);
    }

    return jsonResponse({
      storage,
      rootFolderPath: storage.root_folder_path,
      status: storage.status,
    });
  } catch (err) {
    console.error('band-song-part-storage-setup failed', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Unable to set up song-part storage.',
      500,
    );
  }
};
