import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from './env';

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    const secretKey = getSupabaseSecretKey();
    if (!secretKey) {
      throw new Error('SUPABASE_SECRET_KEY is required for server-side integration routes.');
    }

    adminClient = createClient(getSupabaseUrl(), secretKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

export async function getUserFromBearerToken(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return null;
  }

  const publishableKey = getSupabasePublishableKey();
  if (!publishableKey) {
    throw new Error('SUPABASE_PUBLISHABLE_KEY is required to verify user sessions.');
  }

  const authClient = createClient(getSupabaseUrl(), publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function userOwnsBand(userId: string, bandId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('bandie_band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('role', 'owner')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function userIsBandMember(userId: string, bandId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('bandie_band_members')
    .select('id')
    .eq('band_id', bandId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}
