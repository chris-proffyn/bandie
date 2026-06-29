import type { Handler, HandlerEvent } from '@netlify/functions';
import { loadDropboxAccessToken, verifyDropboxFolder } from './lib/dropboxTokens';
import { errorResponse, jsonResponse } from './lib/http';
import { getSupabaseAdmin, getUserFromBearerToken, userIsBandMember } from './lib/supabase';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const user = await getUserFromBearerToken(new Request('http://localhost', {
      headers: event.headers as HeadersInit,
    }));

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const bandId = event.queryStringParameters?.bandId?.trim();
    if (!bandId) {
      return errorResponse('bandId is required.', 400);
    }

    const isMember = await userIsBandMember(user.id, bandId);
    if (!isMember) {
      return errorResponse('You are not a member of this band.', 403);
    }

    const admin = getSupabaseAdmin();
    const { data: storage, error: storageError } = await admin
      .from('bandie_band_song_part_storage')
      .select(`
        id,
        band_id,
        provider,
        integration_id,
        owning_user_id,
        root_folder_path,
        root_folder_id,
        status,
        last_health_check_at,
        created_at,
        updated_at
      `)
      .eq('band_id', bandId)
      .eq('provider', 'dropbox')
      .maybeSingle();

    if (storageError) {
      throw new Error(storageError.message);
    }

    if (!storage) {
      return jsonResponse({
        status: 'not_configured',
        provider: 'dropbox',
      });
    }

    const { data: integration, error: integrationError } = await admin
      .from('bandie_user_integrations')
      .select('id, provider_account_email, status, token_expires_at')
      .eq('id', storage.integration_id)
      .maybeSingle();

    if (integrationError) {
      throw new Error(integrationError.message);
    }

    const { data: ownerProfile } = await admin
      .from('bandie_profiles')
      .select('display_name')
      .eq('user_id', storage.owning_user_id)
      .maybeSingle();

    let status = storage.status;
    let lastHealthCheckAt = storage.last_health_check_at;

    if (integration && integration.status === 'connected' && storage.root_folder_path) {
      const verifiedStatus = await verifyDropboxFolder(
        admin,
        {
          id: integration.id,
          token_expires_at: integration.token_expires_at,
        },
        storage.root_folder_path,
      );

      status = verifiedStatus;
      lastHealthCheckAt = new Date().toISOString();

      if (verifiedStatus !== storage.status) {
        await admin
          .from('bandie_band_song_part_storage')
          .update({
            status: verifiedStatus,
            last_health_check_at: lastHealthCheckAt,
            updated_at: lastHealthCheckAt,
          })
          .eq('id', storage.id);
      } else {
        await admin
          .from('bandie_band_song_part_storage')
          .update({
            last_health_check_at: lastHealthCheckAt,
            updated_at: lastHealthCheckAt,
          })
          .eq('id', storage.id);
      }
    } else if (integration?.status === 'needs_reconnect' || integration?.status === 'disconnected') {
      status = 'needs_reconnect';
    }

    // Validate token still loads when connected
    if (integration && integration.status === 'connected' && status === 'active') {
      try {
        await loadDropboxAccessToken(admin, {
          id: integration.id,
          token_expires_at: integration.token_expires_at,
        });
      } catch {
        status = 'needs_reconnect';
      }
    }

    return jsonResponse({
      status,
      provider: 'dropbox',
      storageOwner: ownerProfile?.display_name ?? null,
      providerAccountEmail: integration?.provider_account_email ?? null,
      rootFolderPath: storage.root_folder_path,
      integrationStatus: integration?.status ?? 'disconnected',
      lastHealthCheckAt,
    });
  } catch (err) {
    console.error('band-song-part-storage-health failed', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Unable to check song-part storage health.',
      500,
    );
  }
};
