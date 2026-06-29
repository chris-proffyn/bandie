import { getBandieClient } from './context';
import {
  isEntitlementEnforcementEnabled,
  resolveEntitlementEnforcement,
  setPlatformEntitlementEnforcement,
} from './entitlementEnforcement';

const PLATFORM_ENFORCEMENT_KEY = 'entitlements_enforced';

let platformEnforcementLoaded = false;

export async function loadPlatformEntitlementEnforcement(): Promise<boolean> {
  try {
    const client = getBandieClient();
    const { data, error } = await client
      .from('bandie_platform_settings')
      .select('value')
      .eq('key', PLATFORM_ENFORCEMENT_KEY)
      .maybeSingle();

    if (error) {
      return isEntitlementEnforcementEnabled();
    }

    const enabled = resolveEntitlementEnforcement(data?.value);
    setPlatformEntitlementEnforcement(enabled);
    platformEnforcementLoaded = true;
    return enabled;
  } catch {
    return isEntitlementEnforcementEnabled();
  }
}

export function isPlatformEnforcementLoaded(): boolean {
  return platformEnforcementLoaded;
}

export async function getPlatformSetting<T = unknown>(key: string): Promise<T | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.value as T | undefined) ?? null;
}

export async function setPlatformSetting(
  key: string,
  value: unknown,
): Promise<void> {
  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error('Must be signed in.');
  }

  const { error } = await client.from('bandie_platform_settings').upsert({
    key,
    value,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (key === PLATFORM_ENFORCEMENT_KEY) {
    setPlatformEntitlementEnforcement(
      resolveEntitlementEnforcement(value as string | boolean | null | undefined),
    );
    platformEnforcementLoaded = true;
  }
}

export async function setEntitlementsEnforced(enabled: boolean): Promise<void> {
  await setPlatformSetting(PLATFORM_ENFORCEMENT_KEY, enabled);
}

export async function isEntitlementsEnforcedOnPlatform(): Promise<boolean> {
  const value = await getPlatformSetting<boolean>(PLATFORM_ENFORCEMENT_KEY);
  return resolveEntitlementEnforcement(value);
}
