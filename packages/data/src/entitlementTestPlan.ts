import { getCurrentSession } from './auth';
import { getBandieClient } from './context';
import { isEntitlementEnforcementEnabled } from './entitlementEnforcement';
import { PLAN_DISPLAY_NAMES, type PlanCode } from './entitlementTypes';
import { isLaunchPromoSubscription } from './launchPromo';
import { isEntitlementsEnforcedOnPlatform } from './platformSettings';

export const PLAYER_ENTITLEMENT_TEST_PLAN_CODES = [
  'player_free',
  'player_plus',
  'player_pro',
] as const;

export type PlayerEntitlementTestPlanCode = (typeof PLAYER_ENTITLEMENT_TEST_PLAN_CODES)[number];

export type EntitlementTestPlanSettings = {
  leaderPlanCode: PlayerEntitlementTestPlanCode | null;
};

export function isPlayerEntitlementTestPlanCode(
  value: string | null | undefined,
): value is PlayerEntitlementTestPlanCode {
  return (
    value != null &&
    (PLAYER_ENTITLEMENT_TEST_PLAN_CODES as readonly string[]).includes(value)
  );
}

export function shouldApplyEntitlementTestPlanOverride(
  testPlanCode: string | null | undefined,
  options: { isLaunchPromo: boolean; enforcementEnabled: boolean },
): boolean {
  if (!isPlayerEntitlementTestPlanCode(testPlanCode)) {
    return false;
  }

  return options.isLaunchPromo || options.enforcementEnabled;
}

export function resolveEffectiveLeaderPlanCode(
  subscriptionPlanCode: string,
  testPlanCode: string | null | undefined,
  options: { isLaunchPromo: boolean; enforcementEnabled: boolean },
): string {
  if (shouldApplyEntitlementTestPlanOverride(testPlanCode, options)) {
    return testPlanCode as PlayerEntitlementTestPlanCode;
  }

  return subscriptionPlanCode;
}

export function formatEntitlementTestPlanLabel(planCode: PlayerEntitlementTestPlanCode): string {
  return PLAN_DISPLAY_NAMES[planCode as PlanCode] ?? planCode;
}

export async function getEntitlementTestPlanSettings(
  userId?: string,
): Promise<EntitlementTestPlanSettings> {
  const client = getBandieClient();
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { leaderPlanCode: null };
    }
    resolvedUserId = session.user.id;
  }

  const { data, error } = await client
    .from('bandie_profiles')
    .select('entitlement_test_leader_plan_code')
    .eq('user_id', resolvedUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const leaderPlanCode = isPlayerEntitlementTestPlanCode(data?.entitlement_test_leader_plan_code)
    ? data.entitlement_test_leader_plan_code
    : null;

  return { leaderPlanCode };
}

async function userHasActiveLaunchPromoLeaderSubscription(userId: string): Promise<boolean> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_subscriptions')
    .select('source, stripe_subscription_id, status, plan_scope')
    .eq('subject_type', 'user')
    .eq('subject_id', userId)
    .eq('plan_scope', 'leader')
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return false;
  }

  return isLaunchPromoSubscription({
    source: data.source as string,
    stripeSubscriptionId: (data.stripe_subscription_id as string | null) ?? null,
  });
}

export async function canConfigureEntitlementTestLeaderPlan(userId?: string): Promise<boolean> {
  const session = await getCurrentSession();
  const resolvedUserId = userId ?? session?.user?.id;
  if (!resolvedUserId) {
    return false;
  }

  if (await userHasActiveLaunchPromoLeaderSubscription(resolvedUserId)) {
    return true;
  }

  if (isEntitlementEnforcementEnabled()) {
    return true;
  }

  return isEntitlementsEnforcedOnPlatform();
}

export async function updateEntitlementTestLeaderPlan(
  planCode: PlayerEntitlementTestPlanCode | null,
): Promise<EntitlementTestPlanSettings> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Sign in to update plan testing settings.');
  }

  if (planCode !== null && !(await canConfigureEntitlementTestLeaderPlan(session.user.id))) {
    throw new Error(
      'Plan testing is available during launch access or while entitlements are enforced.',
    );
  }

  const client = getBandieClient();
  const { error } = await client
    .from('bandie_profiles')
    .update({ entitlement_test_leader_plan_code: planCode })
    .eq('user_id', session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return { leaderPlanCode: planCode };
}
