import { getBandieClient } from './context';
import { setPlatformAccessModeState } from './entitlementEnforcement';
import { getPlatformSetting, setPlatformSetting } from './platformSettings';

export const PLATFORM_ACCESS_MODE_KEY = 'platform_access_mode';

export type PlatformAccessMode = 'off' | 'beta' | 'promo';

export type PlatformAccessModeConfig = {
  mode: PlatformAccessMode;
  endsAt: string | null;
  note: string | null;
};

export type PlatformAccessModeStatus = PlatformAccessModeConfig & {
  active: boolean;
  daysRemaining: number | null;
  label: string | null;
};

function parseMode(value: unknown): PlatformAccessMode {
  if (value === 'beta' || value === 'promo') {
    return value;
  }
  return 'off';
}

function parseEndsAt(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

export function buildPlatformAccessModeStatus(
  config: PlatformAccessModeConfig,
  now = Date.now(),
): PlatformAccessModeStatus {
  const endsMs = config.endsAt ? new Date(config.endsAt).getTime() : null;
  const active =
    (config.mode === 'beta' || config.mode === 'promo') &&
    (endsMs == null || !Number.isFinite(endsMs) || endsMs > now);

  let daysRemaining: number | null = null;
  if (active && endsMs != null && Number.isFinite(endsMs)) {
    daysRemaining = Math.max(1, Math.ceil((endsMs - now) / (24 * 60 * 60 * 1000)));
  }

  const label = active
    ? config.mode === 'beta'
      ? 'Beta'
      : config.mode === 'promo'
        ? 'Promo'
        : null
    : null;

  return {
    ...config,
    active,
    daysRemaining,
    label,
  };
}

export function parsePlatformAccessModeConfig(raw: unknown): PlatformAccessModeConfig {
  if (!raw || typeof raw !== 'object') {
    return { mode: 'off', endsAt: null, note: null };
  }

  const row = raw as Record<string, unknown>;
  return {
    mode: parseMode(row.mode),
    endsAt: parseEndsAt(row.ends_at ?? row.endsAt),
    note: typeof row.note === 'string' && row.note.trim() ? row.note.trim() : null,
  };
}

function normalizeStatus(raw: unknown): PlatformAccessModeStatus {
  if (!raw || typeof raw !== 'object') {
    return buildPlatformAccessModeStatus({ mode: 'off', endsAt: null, note: null });
  }

  const row = raw as Record<string, unknown>;
  if (typeof row.active === 'boolean') {
    return {
      mode: parseMode(row.mode),
      endsAt: parseEndsAt(row.ends_at ?? row.endsAt),
      note: typeof row.note === 'string' && row.note.trim() ? row.note.trim() : null,
      active: row.active,
      daysRemaining:
        row.days_remaining == null || row.daysRemaining == null
          ? null
          : Number(row.days_remaining ?? row.daysRemaining),
      label: row.label ? String(row.label) : null,
    };
  }

  return buildPlatformAccessModeStatus(parsePlatformAccessModeConfig(raw));
}

export function getPlatformAccessModeTitle(status: PlatformAccessModeStatus): string {
  if (!status.active || !status.label) {
    return '';
  }

  if (status.mode === 'beta') {
    return 'Full access during the Bandie beta';
  }

  if (status.endsAt && status.daysRemaining != null) {
    return `Limited-time full access — ${status.daysRemaining} day(s) remaining`;
  }

  return 'Limited-time full access — explore all features';
}

export async function getPlatformAccessModeStatus(): Promise<PlatformAccessModeStatus> {
  const client = getBandieClient();
  const { data, error } = await client.rpc('bandie_get_platform_access_mode');

  if (error) {
    throw new Error(error.message);
  }

  return normalizeStatus(data);
}

export async function loadPlatformAccessMode(): Promise<PlatformAccessModeStatus> {
  try {
    const status = await getPlatformAccessModeStatus();
    setPlatformAccessModeState(status);
    return status;
  } catch {
    const fallback = buildPlatformAccessModeStatus({ mode: 'off', endsAt: null, note: null });
    setPlatformAccessModeState(fallback);
    return fallback;
  }
}

export async function getPlatformAccessModeConfig(): Promise<PlatformAccessModeConfig> {
  const raw = await getPlatformSetting<unknown>(PLATFORM_ACCESS_MODE_KEY);
  return parsePlatformAccessModeConfig(raw);
}

export async function setPlatformAccessMode(input: PlatformAccessModeConfig): Promise<PlatformAccessModeStatus> {
  const config: PlatformAccessModeConfig = {
    mode: input.mode,
    endsAt: input.endsAt,
    note: input.note?.trim() ? input.note.trim() : null,
  };

  await setPlatformSetting(PLATFORM_ACCESS_MODE_KEY, {
    mode: config.mode,
    ends_at: config.endsAt,
    note: config.note,
  });

  const status = buildPlatformAccessModeStatus(config);
  setPlatformAccessModeState(status);
  return status;
}

export function formatPlatformAccessModeEndDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
