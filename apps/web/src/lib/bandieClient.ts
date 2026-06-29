import { initBandieData } from '@bandie/data';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appCode = import.meta.env.VITE_APP_CODE ?? 'bandie';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Auth features will not work.');
} else {
  initBandieData({
    supabaseUrl,
    supabaseAnonKey,
    appCode,
    dataMode: import.meta.env.VITE_BANDIE_DATA_MODE,
    enforceEntitlements: import.meta.env.VITE_BANDIE_ENFORCE_ENTITLEMENTS,
  });
}

export function getAppOrigin(): string {
  return import.meta.env.VITE_APP_URL ?? window.location.origin;
}
