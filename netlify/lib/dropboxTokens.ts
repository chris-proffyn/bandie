import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptSecret, encryptSecret } from './crypto';
import { getDropboxMetadata, refreshDropboxAccessToken } from './dropbox';
import { getIntegrationTokenKey } from './env';

type IntegrationRow = {
  id: string;
  token_expires_at: string | null;
};

export async function loadDropboxAccessToken(
  admin: SupabaseClient,
  integration: IntegrationRow,
): Promise<string> {
  const { data: secrets, error } = await admin
    .from('bandie_user_integration_secrets')
    .select('encrypted_access_token, encrypted_refresh_token')
    .eq('integration_id', integration.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!secrets) {
    throw new Error('Dropbox credentials are missing. Reconnect Dropbox.');
  }

  const encryptionKey = getIntegrationTokenKey();
  const expiresAt = integration.token_expires_at ? Date.parse(integration.token_expires_at) : null;
  const needsRefresh = Boolean(expiresAt && expiresAt <= Date.now() + 60_000);

  if (!needsRefresh) {
    return decryptSecret(secrets.encrypted_access_token, encryptionKey);
  }

  if (!secrets.encrypted_refresh_token) {
    throw new Error('Dropbox access token expired. Reconnect Dropbox.');
  }

  const refreshToken = decryptSecret(secrets.encrypted_refresh_token, encryptionKey);
  const refreshed = await refreshDropboxAccessToken(refreshToken);
  const tokenExpiresAt = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null;

  await admin
    .from('bandie_user_integrations')
    .update({
      token_expires_at: tokenExpiresAt,
      status: 'connected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id);

  await admin
    .from('bandie_user_integration_secrets')
    .update({
      encrypted_access_token: encryptSecret(refreshed.access_token, encryptionKey),
      encrypted_refresh_token: refreshed.refresh_token
        ? encryptSecret(refreshed.refresh_token, encryptionKey)
        : secrets.encrypted_refresh_token,
      updated_at: new Date().toISOString(),
    })
    .eq('integration_id', integration.id);

  return refreshed.access_token;
}

export async function verifyDropboxFolder(
  admin: SupabaseClient,
  integration: IntegrationRow,
  rootFolderPath: string,
): Promise<'active' | 'folder_missing' | 'permission_error' | 'needs_reconnect'> {
  try {
    const accessToken = await loadDropboxAccessToken(admin, integration);
    await getDropboxMetadata(accessToken, rootFolderPath);
    return 'active';
  } catch (err) {
    const message = err instanceof Error ? err.message.toLowerCase() : '';
    if (message.includes('not_found') || message.includes('path/not_found')) {
      return 'folder_missing';
    }
    if (message.includes('expired') || message.includes('invalid_access_token')) {
      return 'needs_reconnect';
    }
    if (message.includes('insufficient') || message.includes('permission')) {
      return 'permission_error';
    }
    return 'permission_error';
  }
}
