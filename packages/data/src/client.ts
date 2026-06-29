import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface BandieClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appCode?: string;
  /** `test` shows fictitious bands/players; `live` hides rows where test_user is true */
  dataMode?: string;
  /** When true, tier limits from entitlements are enforced (default off until Phase 14). */
  enforceEntitlements?: string | boolean;
}

const DEFAULT_APP_CODE = 'bandie';

export function getAppCode(appCode?: string): string {
  return appCode ?? DEFAULT_APP_CODE;
}

/**
 * Creates the Bandie Supabase client. All database access must go through
 * the data layer — UI code must not call createClient directly.
 */
export function createBandieClient(config: BandieClientConfig): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = config;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase URL and anon key are required. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : undefined,
    },
  });
}
