import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  buildDropboxAuthorizeUrl,
  createOAuthState,
  hashOAuthState,
} from '../lib/dropbox';
import { errorResponse, jsonResponse } from '../lib/http';
import { getSupabaseAdmin, getUserFromBearerToken, userOwnsBand } from '../lib/supabase';

type ConnectBody = {
  bandId?: string;
  purpose?: string;
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

    const body = event.body ? (JSON.parse(event.body) as ConnectBody) : {};
    const bandId = body.bandId?.trim();
    const purpose = body.purpose?.trim() || 'song_part_storage';

    if (bandId) {
      const ownsBand = await userOwnsBand(user.id, bandId);
      if (!ownsBand) {
        return errorResponse('Only band leaders can connect Dropbox for this band.', 403);
      }
    }

    const state = createOAuthState();
    const stateHash = hashOAuthState(state);
    const admin = getSupabaseAdmin();

    const { error } = await admin.from('bandie_integration_oauth_states').insert({
      state_hash: stateHash,
      user_id: user.id,
      band_id: bandId ?? null,
      purpose,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return jsonResponse({
      redirectUrl: buildDropboxAuthorizeUrl(state),
    });
  } catch (err) {
    console.error('dropbox-connect failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to start Dropbox connect.', 500);
  }
};
