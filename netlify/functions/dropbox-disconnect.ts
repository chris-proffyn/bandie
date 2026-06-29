import type { Handler, HandlerEvent } from '@netlify/functions';
import { errorResponse, jsonResponse } from './lib/http';
import { getSupabaseAdmin, getUserFromBearerToken } from './lib/supabase';

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

    const admin = getSupabaseAdmin();
    const { data: integration, error } = await admin
      .from('bandie_user_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'dropbox')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!integration) {
      return errorResponse('No Dropbox integration found for this user.', 404);
    }

    await admin
      .from('bandie_user_integrations')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('id', integration.id);

    await admin.from('bandie_user_integration_secrets').delete().eq('integration_id', integration.id);

    await admin
      .from('bandie_band_song_part_storage')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('integration_id', integration.id);

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('dropbox-disconnect failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to disconnect Dropbox.', 500);
  }
};
