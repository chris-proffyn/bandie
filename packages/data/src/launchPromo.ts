import { getBandieClient } from './context';
import { getPlatformSetting, setPlatformSetting } from './platformSettings';

export const LAUNCH_PROMO_ENDS_AT_KEY = 'launch_promo_ends_at';

export type LaunchPromoStatus = {
  active: boolean;
  endsAt: string | null;
  daysRemaining: number | null;
};

export function parseLaunchPromoEndsAt(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return null;
}

export function isLaunchTrialExpired(
  trialEnd: string | null | undefined,
  stripeSubscriptionId: string | null | undefined,
): boolean {
  if (stripeSubscriptionId) {
    return false;
  }
  if (!trialEnd) {
    return false;
  }
  return new Date(trialEnd).getTime() <= Date.now();
}

export function isLaunchPromoSubscription(subscription: {
  source: string;
  stripeSubscriptionId?: string | null;
}): boolean {
  return subscription.source === 'launch_promo' && !subscription.stripeSubscriptionId;
}

export function buildLaunchPromoStatus(endsAt: string | null, now = Date.now()): LaunchPromoStatus {
  if (!endsAt) {
    return { active: false, endsAt: null, daysRemaining: null };
  }

  const endsMs = new Date(endsAt).getTime();
  if (!Number.isFinite(endsMs) || endsMs <= now) {
    return { active: false, endsAt, daysRemaining: 0 };
  }

  const daysRemaining = Math.max(1, Math.ceil((endsMs - now) / (24 * 60 * 60 * 1000)));
  return { active: true, endsAt, daysRemaining };
}

let expireLaunchTrialsPromise: Promise<void> | null = null;

export async function ensureLaunchTrialsExpired(): Promise<void> {
  if (!expireLaunchTrialsPromise) {
    expireLaunchTrialsPromise = (async () => {
      try {
        const { error } = await getBandieClient().rpc('bandie_expire_launch_trials');
        if (error) {
          throw new Error(error.message);
        }
      } finally {
        expireLaunchTrialsPromise = null;
      }
    })();
  }

  await expireLaunchTrialsPromise;
}

export async function getLaunchPromoStatus(): Promise<LaunchPromoStatus> {
  const raw = await getPlatformSetting<unknown>(LAUNCH_PROMO_ENDS_AT_KEY);
  const endsAt = parseLaunchPromoEndsAt(raw);
  return buildLaunchPromoStatus(endsAt);
}

export async function setLaunchPromoEndsAt(isoTimestamp: string): Promise<void> {
  await setPlatformSetting(LAUNCH_PROMO_ENDS_AT_KEY, isoTimestamp);
}

export function formatLaunchPromoEndDate(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
