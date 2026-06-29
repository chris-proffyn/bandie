import { getBandieClient } from './context';
import { getCurrentSession } from './auth';

export type IntegrationProvider = 'dropbox';

export type UserIntegrationStatus = 'connected' | 'needs_reconnect' | 'disconnected' | 'revoked';

export type UserIntegration = {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  provider_account_id: string | null;
  provider_account_email: string | null;
  access_type: string;
  token_expires_at: string | null;
  status: UserIntegrationStatus;
  created_at: string;
  updated_at: string;
};

export type BandSongPartStorageStatus =
  | 'active'
  | 'needs_reconnect'
  | 'folder_missing'
  | 'permission_error'
  | 'disconnected'
  | 'not_configured';

export type BandSongPartStorage = {
  id: string;
  band_id: string;
  provider: IntegrationProvider;
  integration_id: string;
  owning_user_id: string;
  root_folder_path: string;
  root_folder_id: string | null;
  status: Exclude<BandSongPartStorageStatus, 'not_configured'>;
  last_health_check_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SongPartStorageHealth = {
  status: BandSongPartStorageStatus;
  provider: IntegrationProvider;
  storageOwner?: string | null;
  providerAccountEmail?: string | null;
  rootFolderPath?: string | null;
  integrationStatus?: UserIntegrationStatus;
  lastHealthCheckAt?: string | null;
};

function apiBaseUrl(): string {
  return '/api';
}

async function parseApiJson<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  const body = await response.text();

  if (!contentType.includes('application/json')) {
    if (body.trimStart().startsWith('<!')) {
      throw new Error(
        'Song-part API is unavailable in this dev setup. Run npm run dev:full or test on Netlify for Dropbox connect/health.',
      );
    }
    throw new Error('Unexpected response from song-part API.');
  }

  return JSON.parse(body) as T;
}

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to manage song-part storage.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
}

export async function getUserDropboxIntegration(): Promise<UserIntegration | null> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await client
    .from('bandie_user_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'dropbox')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserIntegration | null) ?? null;
}

export async function getBandSongPartStorage(bandId: string): Promise<BandSongPartStorage | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_band_song_part_storage')
    .select('*')
    .eq('band_id', bandId)
    .eq('provider', 'dropbox')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as BandSongPartStorage | null) ?? null;
}

export async function startDropboxConnect(bandId?: string): Promise<string> {
  const response = await authorizedFetch('/integrations/dropbox/connect', {
    method: 'POST',
    body: JSON.stringify({
      bandId,
      purpose: 'song_part_storage',
    }),
  });

  const payload = await parseApiJson<{ redirectUrl?: string; error?: string }>(response);
  if (!response.ok || !payload.redirectUrl) {
    throw new Error(payload.error ?? 'Unable to start Dropbox connect.');
  }

  return payload.redirectUrl;
}

export async function setupBandSongPartStorage(
  bandId: string,
  integrationId: string,
): Promise<BandSongPartStorage> {
  const response = await authorizedFetch('/bands/song-part-storage/dropbox/setup', {
    method: 'POST',
    body: JSON.stringify({ bandId, integrationId }),
  });

  const payload = await parseApiJson<{ storage?: BandSongPartStorage; error?: string }>(response);
  if (!response.ok || !payload.storage) {
    throw new Error(payload.error ?? 'Unable to set up song-part storage.');
  }

  return payload.storage;
}

export async function checkBandSongPartStorageHealth(bandId: string): Promise<SongPartStorageHealth> {
  const response = await authorizedFetch(
    `/bands/song-part-storage/dropbox/health?bandId=${encodeURIComponent(bandId)}`,
    { method: 'GET' },
  );

  const payload = await parseApiJson<SongPartStorageHealth & { error?: string }>(response);
  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to check song-part storage health.');
  }

  return payload;
}

export async function disconnectDropbox(): Promise<void> {
  const response = await authorizedFetch('/integrations/dropbox/disconnect', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const payload = await parseApiJson<{ error?: string }>(response);
  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to disconnect Dropbox.');
  }
}

export function buildSongPartStorageHealthFromRecords(
  storage: BandSongPartStorage | null,
  integration: UserIntegration | null,
): SongPartStorageHealth {
  if (!storage) {
    return {
      status: 'not_configured',
      provider: 'dropbox',
      providerAccountEmail: integration?.provider_account_email ?? null,
      integrationStatus: integration?.status,
    };
  }

  return {
    status: storage.status,
    provider: 'dropbox',
    providerAccountEmail: integration?.provider_account_email ?? null,
    rootFolderPath: storage.root_folder_path,
    integrationStatus: integration?.status,
    lastHealthCheckAt: storage.last_health_check_at,
  };
}

export function formatSongPartStorageStatus(status: BandSongPartStorageStatus): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'needs_reconnect':
      return 'Needs reconnect';
    case 'folder_missing':
      return 'Folder missing';
    case 'permission_error':
      return 'Permission error';
    case 'disconnected':
      return 'Disconnected';
    case 'not_configured':
      return 'Not configured';
    default:
      return status;
  }
}
