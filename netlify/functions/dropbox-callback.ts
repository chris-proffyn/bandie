import type { Handler, HandlerEvent } from '@netlify/functions';
import { encryptSecret } from '../lib/crypto';
import {
  exchangeDropboxCode,
  getDropboxAccount,
  hashOAuthState,
} from '../lib/dropbox';
import { getAppUrl, getIntegrationTokenKey } from '../lib/env';
import { errorResponse, redirectResponse } from '../lib/http';
import { getSupabaseAdmin } from '../lib/supabase';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  const params = event.queryStringParameters ?? {};
  const code = params.code?.trim();
  const state = params.state?.trim();
  const oauthError = params.error?.trim();

  const appUrl = getAppUrl();

  if (oauthError) {
    return redirectResponse(`${appUrl}/app?dropbox=error&reason=${encodeURIComponent(oauthError)}`);
  }

  if (!code || !state) {
    return redirectResponse(`${appUrl}/app?dropbox=error&reason=missing_code`);
  }

  try {
    const admin = getSupabaseAdmin();
    const stateHash = hashOAuthState(state);

    const { data: oauthState, error: stateError } = await admin
      .from('bandie_integration_oauth_states')
      .select('id, user_id, band_id, purpose, expires_at')
      .eq('state_hash', stateHash)
      .maybeSingle();

    if (stateError) {
      throw new Error(stateError.message);
    }

    if (!oauthState || Date.parse(oauthState.expires_at) < Date.now()) {
      return redirectResponse(`${appUrl}/app?dropbox=error&reason=invalid_state`);
    }

    const tokenResponse = await exchangeDropboxCode(code);
    const account = await getDropboxAccount(tokenResponse.access_token);
    const encryptionKey = getIntegrationTokenKey();

    const tokenExpiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
      : null;

    const integrationPayload = {
      user_id: oauthState.user_id,
      provider: 'dropbox',
      provider_account_id: account.account_id,
      provider_account_email: account.email,
      access_type: 'app_folder',
      token_expires_at: tokenExpiresAt,
      status: 'connected',
      updated_at: new Date().toISOString(),
    };

    const { data: integration, error: integrationError } = await admin
      .from('bandie_user_integrations')
      .upsert(integrationPayload, { onConflict: 'user_id,provider' })
      .select('id')
      .single();

    if (integrationError || !integration) {
      throw new Error(integrationError?.message ?? 'Unable to store Dropbox integration.');
    }

    const secretsPayload = {
      integration_id: integration.id,
      encrypted_access_token: encryptSecret(tokenResponse.access_token, encryptionKey),
      encrypted_refresh_token: tokenResponse.refresh_token
        ? encryptSecret(tokenResponse.refresh_token, encryptionKey)
        : null,
      updated_at: new Date().toISOString(),
    };

    const { error: secretsError } = await admin
      .from('bandie_user_integration_secrets')
      .upsert(secretsPayload, { onConflict: 'integration_id' });

    if (secretsError) {
      throw new Error(secretsError.message);
    }

    await admin.from('bandie_integration_oauth_states').delete().eq('id', oauthState.id);

    if (oauthState.band_id) {
      return redirectResponse(
        `${appUrl}/app/bands/${oauthState.band_id}?tab=details&dropbox=connected`,
      );
    }

    return redirectResponse(`${appUrl}/app?dropbox=connected`);
  } catch (err) {
    console.error('dropbox-callback failed', err);
    return redirectResponse(
      `${appUrl}/app?dropbox=error&reason=${encodeURIComponent(
        err instanceof Error ? err.message : 'callback_failed',
      )}`,
    );
  }
};
