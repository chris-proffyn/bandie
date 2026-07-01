let enforcementFromEnv = false;
let enforcementFromPlatform: boolean | null = null;
let platformAccessModeActive = false;

export function resolveEntitlementEnforcement(value: string | boolean | undefined | null): boolean {
  if (value === true) {
    return true;
  }
  if (value === false || value == null) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

export function initBandieEntitlementEnforcement(value: string | boolean | undefined | null): boolean {
  enforcementFromEnv = resolveEntitlementEnforcement(value);
  return isEntitlementEnforcementEnabled();
}

export function setPlatformEntitlementEnforcement(enabled: boolean): void {
  enforcementFromPlatform = enabled;
}

export function setPlatformAccessModeState(
  status: { active: boolean } | null | undefined,
): void {
  platformAccessModeActive = Boolean(status?.active);
}

export function isPlatformAccessModeActive(): boolean {
  return platformAccessModeActive;
}

export function isEntitlementEnforcementEnabled(): boolean {
  if (enforcementFromEnv) {
    return true;
  }
  if (platformAccessModeActive) {
    return false;
  }
  return enforcementFromPlatform === true;
}
