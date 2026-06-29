function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required('SUPABASE_URL');
}

export function getSupabasePublishableKey(): string {
  return process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
}

export function getSupabaseSecretKey(): string {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
}

export function getDropboxAppKey(): string {
  return required('DROPBOX_APP_KEY');
}

export function getDropboxAppSecret(): string {
  return required('DROPBOX_APP_SECRET');
}

export function getIntegrationTokenKey(): string {
  return required('BANDIE_INTEGRATION_TOKEN_KEY');
}

export function getAppUrl(): string {
  const configured = process.env.VITE_APP_URL ?? process.env.APP_URL ?? process.env.URL;
  if (!configured) {
    throw new Error('Missing VITE_APP_URL, APP_URL, or URL for redirect handling.');
  }
  return configured.replace(/\/$/, '');
}

export function getDropboxRedirectUri(): string {
  return `${getAppUrl()}/api/integrations/dropbox/callback`;
}
