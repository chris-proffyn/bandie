import { getCurrentSession } from './auth';
import { getBandieClient } from './context';
import type { EntitlementPlanScope } from './entitlementTypes';
import { PLAN_DISPLAY_NAMES, type PlanCode } from './entitlementTypes';
import {
  formatEntitlementTestPlanLabel,
  getEntitlementTestPlanSettings,
  resolveEffectiveLeaderPlanCode,
  resolveEffectiveOrganiserPlanCode,
  shouldApplyLeaderTestPlanOverride,
  shouldApplyOrganiserTestPlanOverride,
  type OrganiserEntitlementTestPlanCode,
  type PlayerEntitlementTestPlanCode,
} from './entitlementTestPlan';
import {
  ensureLaunchTrialsExpired,
  isLaunchPromoSubscription,
  isLaunchTrialExpired,
} from './launchPromo';

export type UserSubscriptionSummary = {
  id: string;
  planScope: EntitlementPlanScope;
  planCode: string;
  planName: string;
  status: string;
  source: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  billingInterval: string | null;
  isLaunchPromo: boolean;
  /** Plan on the subscription record (before launch-promo test override). */
  subscriptionPlanCode: string;
  subscriptionPlanName: string;
  /** When set, the user is simulating a lower tier than their subscription record. */
  testPlanOverride: PlayerEntitlementTestPlanCode | OrganiserEntitlementTestPlanCode | null;
};

export type PublicPlanOffer = {
  code: string;
  name: string;
  description: string | null;
  billingInterval: string;
  displayOrder: number;
  isPaid: boolean;
  priceLabel: string | null;
};

const PAID_PLAN_PRICES_GBP: Record<string, string> = {
  player_plus: '£4/month',
  player_pro: '£10/month',
  organiser_plus: '£15/month',
};

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = await getCurrentSession();
  if (!session?.access_token) {
    throw new Error('Sign in to manage billing.');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`/api${path}`, { ...init, headers });
}

async function parseApiJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  try {
    return JSON.parse(body) as T;
  } catch {
    const firstLine = body.split('\n').find((line) => line.trim())?.trim();
    throw new Error(firstLine?.slice(0, 240) ?? 'Unexpected response from billing API.');
  }
}

export async function listUserSubscriptions(userId?: string): Promise<UserSubscriptionSummary[]> {
  await ensureLaunchTrialsExpired();

  const client = getBandieClient();
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return [];
    }
    resolvedUserId = user.id;
  }

  const { data, error } = await client
    .from('bandie_subscriptions')
    .select(
      'id, plan_scope, status, source, stripe_customer_id, stripe_subscription_id, current_period_end, trial_end, cancel_at_period_end, bandie_plans!inner(code, name, billing_interval)',
    )
    .eq('subject_type', 'user')
    .eq('subject_id', resolvedUserId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('plan_scope');

  if (error) {
    throw new Error(error.message);
  }

  const testSettings = await getEntitlementTestPlanSettings(resolvedUserId);

  return (data ?? [])
    .filter((row) => {
      const stripeSubscriptionId = (row.stripe_subscription_id as string | null) ?? null;
      const trialEnd = (row.trial_end as string | null) ?? null;
      return !isLaunchTrialExpired(trialEnd, stripeSubscriptionId);
    })
    .map((row) => {
    const plan = row.bandie_plans as
      | { code: string; name: string; billing_interval: string }
      | { code: string; name: string; billing_interval: string }[];
    const planRow = Array.isArray(plan) ? plan[0] : plan;
    const stripeSubscriptionId = (row.stripe_subscription_id as string | null) ?? null;
    const source = row.source as string;
    const planScope = row.plan_scope as EntitlementPlanScope;
    const isLaunchPromo = isLaunchPromoSubscription({ source, stripeSubscriptionId });
    const leaderTestPlan = testSettings.leaderPlanCode;
    const organiserTestPlan = testSettings.organiserPlanCode;
    const canApplyLeaderOverride = shouldApplyLeaderTestPlanOverride(leaderTestPlan);
    const canApplyOrganiserOverride = shouldApplyOrganiserTestPlanOverride(organiserTestPlan);
    const effectivePlanCode =
      planScope === 'leader'
        ? resolveEffectiveLeaderPlanCode(
            planRow.code,
            canApplyLeaderOverride ? leaderTestPlan : null,
          )
        : resolveEffectiveOrganiserPlanCode(
            planRow.code,
            canApplyOrganiserOverride ? organiserTestPlan : null,
          );
    const testPlanOverride =
      planScope === 'leader' &&
      canApplyLeaderOverride &&
      leaderTestPlan !== planRow.code
        ? leaderTestPlan
        : planScope === 'organiser' &&
            canApplyOrganiserOverride &&
            organiserTestPlan !== planRow.code
          ? organiserTestPlan
          : null;
    const effectivePlanName =
      effectivePlanCode === planRow.code
        ? planRow.name
        : formatEntitlementTestPlanLabel(
            effectivePlanCode as PlayerEntitlementTestPlanCode | OrganiserEntitlementTestPlanCode,
          );

    return {
      id: row.id as string,
      planScope,
      planCode: effectivePlanCode,
      planName: effectivePlanName,
      status: row.status as string,
      source,
      stripeCustomerId: (row.stripe_customer_id as string | null) ?? null,
      stripeSubscriptionId,
      currentPeriodEnd: (row.current_period_end as string | null) ?? null,
      trialEnd: (row.trial_end as string | null) ?? null,
      cancelAtPeriodEnd: Boolean(row.cancel_at_period_end),
      billingInterval: planRow.billing_interval ?? null,
      isLaunchPromo,
      subscriptionPlanCode: planRow.code,
      subscriptionPlanName: planRow.name,
      testPlanOverride,
    };
  });
}

export async function listPublicPlanOffers(
  planScope?: EntitlementPlanScope,
): Promise<PublicPlanOffer[]> {
  const client = getBandieClient();
  let query = client
    .from('bandie_plans')
    .select('code, name, description, billing_interval, display_order, status, is_public')
    .eq('status', 'active')
    .eq('is_public', true)
    .order('display_order');

  if (planScope === 'leader') {
    query = query.in('code', ['player_free', 'player_plus', 'player_pro']);
  } else if (planScope === 'organiser') {
    query = query.in('code', ['organiser_free', 'organiser_plus']);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const code = row.code as string;
    const isPaid = row.billing_interval === 'monthly';

    return {
      code,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      billingInterval: row.billing_interval as string,
      displayOrder: row.display_order as number,
      isPaid,
      priceLabel: isPaid ? (PAID_PLAN_PRICES_GBP[code] ?? null) : 'Free',
    };
  });
}

export async function startPlanCheckout(
  planCode: PlanCode | string,
  planScope: EntitlementPlanScope,
): Promise<string> {
  const response = await authorizedFetch('/billing/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ planCode, planScope }),
  });

  const payload = await parseApiJson<{ checkoutUrl?: string; error?: string }>(response);
  if (!response.ok || !payload.checkoutUrl) {
    throw new Error(payload.error ?? 'Unable to start checkout.');
  }

  return payload.checkoutUrl;
}

export async function openBillingPortal(planScope: EntitlementPlanScope): Promise<string> {
  const response = await authorizedFetch('/billing/create-portal', {
    method: 'POST',
    body: JSON.stringify({ planScope }),
  });

  const payload = await parseApiJson<{ portalUrl?: string; error?: string }>(response);
  if (!response.ok || !payload.portalUrl) {
    throw new Error(payload.error ?? 'Unable to open billing portal.');
  }

  return payload.portalUrl;
}

export async function syncStripePlanCatalogueAsAdmin(): Promise<Record<string, unknown>> {
  const response = await authorizedFetch('/billing/setup-stripe-plans', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  const payload = await parseApiJson<{ plans?: Record<string, unknown>; error?: string }>(response);
  if (!response.ok) {
    throw new Error(payload.error ?? 'Unable to sync Stripe plans.');
  }

  return payload.plans ?? {};
}

export async function listStripeWebhookEvents(limit = 50): Promise<
  Array<{
    id: string;
    stripeEventId: string;
    eventType: string;
    processedAt: string;
  }>
> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_stripe_webhook_events')
    .select('id, stripe_event_id, event_type, processed_at')
    .order('processed_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    stripeEventId: row.stripe_event_id as string,
    eventType: row.event_type as string,
    processedAt: row.processed_at as string,
  }));
}

export function formatPlanDisplayName(code: string): string {
  return PLAN_DISPLAY_NAMES[code as PlanCode] ?? code;
}
