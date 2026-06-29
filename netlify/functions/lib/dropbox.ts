import { createHash, randomBytes } from 'node:crypto';
import { decryptSecret } from './crypto';
import { getDropboxAppKey, getDropboxAppSecret, getDropboxRedirectUri } from './env';

const DROPBOX_AUTHORIZE_URL = 'https://www.dropbox.com/oauth2/authorize';
const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const DROPBOX_API_RPC = 'https://api.dropboxapi.com/2';

export type DropboxTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  account_id?: string;
  uid?: string;
};

export type DropboxAccount = {
  account_id: string;
  email: string;
  name?: {
    display_name?: string;
  };
};

export function createOAuthState(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOAuthState(state: string): string {
  return createHash('sha256').update(state).digest('hex');
}

export function buildDropboxAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: getDropboxAppKey(),
    redirect_uri: getDropboxRedirectUri(),
    response_type: 'code',
    token_access_type: 'offline',
    state,
  });

  return `${DROPBOX_AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeDropboxCode(code: string): Promise<DropboxTokenResponse> {
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: getDropboxAppKey(),
    client_secret: getDropboxAppSecret(),
    redirect_uri: getDropboxRedirectUri(),
  });

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Dropbox token exchange failed: ${detail}`);
  }

  return (await response.json()) as DropboxTokenResponse;
}

export async function refreshDropboxAccessToken(refreshToken: string): Promise<DropboxTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: getDropboxAppKey(),
    client_secret: getDropboxAppSecret(),
  });

  const response = await fetch(DROPBOX_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Dropbox token refresh failed: ${detail}`);
  }

  return (await response.json()) as DropboxTokenResponse;
}

export async function getDropboxAccount(accessToken: string): Promise<DropboxAccount> {
  const response = await fetch(`${DROPBOX_API_RPC}/users/get_current_account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: 'null',
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Dropbox account lookup failed: ${detail}`);
  }

  return (await response.json()) as DropboxAccount;
}

export async function createDropboxFolder(
  accessToken: string,
  path: string,
): Promise<{ id: string; path_lower: string; path_display: string }> {
  const response = await fetch(`${DROPBOX_API_RPC}/files/create_folder_v2`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path,
      autorename: false,
    }),
  });

  if (response.ok) {
    const payload = (await response.json()) as {
      metadata: { id: string; path_lower: string; path_display: string };
    };
    return payload.metadata;
  }

  const detail = await response.text();
  if (detail.includes('path/conflict/folder')) {
    const existing = await getDropboxMetadata(accessToken, path);
    return {
      id: existing.id,
      path_lower: existing.path_lower,
      path_display: existing.path_display,
    };
  }

  throw new Error(`Dropbox folder creation failed: ${detail}`);
}

export async function getDropboxMetadata(
  accessToken: string,
  path: string,
): Promise<{ id: string; path_lower: string; path_display: string }> {
  const response = await fetch(`${DROPBOX_API_RPC}/files/get_metadata`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Dropbox metadata lookup failed: ${detail}`);
  }

  const payload = (await response.json()) as {
    id: string;
    path_lower: string;
    path_display: string;
  };

  return payload;
}

export async function resolveDropboxAccessToken(
  encryptedAccessToken: string,
  encryptedRefreshToken: string | null,
  tokenExpiresAt: string | null,
  decryptKey: string,
): Promise<string> {
  const accessToken = decryptSecret(encryptedAccessToken, decryptKey);
  const expiresAt = tokenExpiresAt ? Date.parse(tokenExpiresAt) : null;

  if (!expiresAt || expiresAt > Date.now() + 60_000) {
    return accessToken;
  }

  if (!encryptedRefreshToken) {
    throw new Error('Dropbox access token expired and no refresh token is available.');
  }

  const refreshToken = decryptSecret(encryptedRefreshToken, decryptKey);
  const refreshed = await refreshDropboxAccessToken(refreshToken);
  return refreshed.access_token;
}

export function bandSongPartsRootPath(bandSlug: string): string {
  return `/Bandie/bands/${bandSlug}/song-parts`;
}
