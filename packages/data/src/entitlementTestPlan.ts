import { getCurrentSession } from './auth';
import { getBandieClient } from './context';
import { type EntitlementPlanScope } from './entitlementTypes';
import { PLAN_DISPLAY_NAMES, type PlanCode } from './entitlementTypes';

export const PLAYER_ENTITLEMENT_TEST_PLAN_CODES = [
  'player_free',
  'player_plus',
  'player_pro',
] as const;

export const ORGANISER_ENTITLEMENT_TEST_PLAN_CODES = [
  'organiser_free',
  'organiser_plus',
] as const;

export type PlayerEntitlementTestPlanCode = (typeof PLAYER_ENTITLEMENT_TEST_PLAN_CODES)[number];
export type OrganiserEntitlementTestPlanCode =
  (typeof ORGANISER_ENTITLEMENT_TEST_PLAN_CODES)[number];

export type EntitlementTestPlanSettings = {
  leaderPlanCode: PlayerEntitlementTestPlanCode | null;
  organiserPlanCode: OrganiserEntitlementTestPlanCode | null;
};

export function isPlayerEntitlementTestPlanCode(
  value: string | null | undefined,
): value is PlayerEntitlementTestPlanCode {
  return (
    value != null &&
    (PLAYER_ENTITLEMENT_TEST_PLAN_CODES as readonly string[]).includes(value)
  );
}

export function isOrganiserEntitlementTestPlanCode(
  value: string | null | undefined,
): value is OrganiserEntitlementTestPlanCode {
  return (
    value != null &&
    (ORGANISER_ENTITLEMENT_TEST_PLAN_CODES as readonly string[]).includes(value)
  );
}

export function shouldApplyLeaderTestPlanOverride(
  testPlanCode: string | null | undefined,
): testPlanCode is PlayerEntitlementTestPlanCode {
  return isPlayerEntitlementTestPlanCode(testPlanCode);
}

export function shouldApplyOrganiserTestPlanOverride(
  testPlanCode: string | null | undefined,
): testPlanCode is OrganiserEntitlementTestPlanCode {
  return isOrganiserEntitlementTestPlanCode(testPlanCode);
}

/** @deprecated Use shouldApplyLeaderTestPlanOverride — kept for call sites during transition. */
export function shouldApplyEntitlementTestPlanOverride(
  testPlanCode: string | null | undefined,
  _options?: { isLaunchPromo: boolean; enforcementEnabled: boolean },
): boolean {
  return shouldApplyLeaderTestPlanOverride(testPlanCode);
}

export function resolveEffectiveLeaderPlanCode(
  subscriptionPlanCode: string,
  testPlanCode: string | null | undefined,
  _options?: { isLaunchPromo: boolean; enforcementEnabled: boolean },
): string {
  if (shouldApplyLeaderTestPlanOverride(testPlanCode)) {
    return testPlanCode;
  }

  return subscriptionPlanCode;
}

export function resolveEffectiveOrganiserPlanCode(
  subscriptionPlanCode: string,
  testPlanCode: string | null | undefined,
): string {
  if (shouldApplyOrganiserTestPlanOverride(testPlanCode)) {
    return testPlanCode;
  }

  return subscriptionPlanCode;
}

export function formatEntitlementTestPlanLabel(
  planCode: PlayerEntitlementTestPlanCode | OrganiserEntitlementTestPlanCode,
): string {
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
      return { leaderPlanCode: null, organiserPlanCode: null };
    }
    resolvedUserId = session.user.id;
  }

  const { data, error } = await client
    .from('bandie_profiles')
    .select('entitlement_test_leader_plan_code, entitlement_test_organiser_plan_code')
    .eq('user_id', resolvedUserId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const leaderPlanCode = isPlayerEntitlementTestPlanCode(data?.entitlement_test_leader_plan_code)
    ? data.entitlement_test_leader_plan_code
    : null;

  const organiserPlanCode = isOrganiserEntitlementTestPlanCode(
    data?.entitlement_test_organiser_plan_code,
  )
    ? data.entitlement_test_organiser_plan_code
    : null;

  return { leaderPlanCode, organiserPlanCode };
}

export async function hasActiveTestPlanSimulation(
  userId: string,
  planScope: EntitlementPlanScope,
): Promise<boolean> {
  const settings = await getEntitlementTestPlanSettings(userId);
  if (planScope === 'organiser') {
    return shouldApplyOrganiserTestPlanOverride(settings.organiserPlanCode);
  }
  return shouldApplyLeaderTestPlanOverride(settings.leaderPlanCode);
}

export async function canConfigureEntitlementTestPlans(_userId?: string): Promise<boolean> {
  const session = await getCurrentSession();
  return Boolean(session?.user);
}

/** @deprecated Use canConfigureEntitlementTestPlans */
export async function canConfigureEntitlementTestLeaderPlan(userId?: string): Promise<boolean> {
  return canConfigureEntitlementTestPlans(userId);
}

export async function updateEntitlementTestLeaderPlan(
  planCode: PlayerEntitlementTestPlanCode | null,
): Promise<EntitlementTestPlanSettings> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Sign in to update plan testing settings.');
  }

  if (!(await canConfigureEntitlementTestPlans(session.user.id))) {
    throw new Error('Sign in to update plan testing settings.');
  }

  const client = getBandieClient();
  const { error } = await client
    .from('bandie_profiles')
    .update({ entitlement_test_leader_plan_code: planCode })
    .eq('user_id', session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return getEntitlementTestPlanSettings(session.user.id);
}

export async function updateEntitlementTestOrganiserPlan(
  planCode: OrganiserEntitlementTestPlanCode | null,
): Promise<EntitlementTestPlanSettings> {
  const session = await getCurrentSession();
  if (!session?.user) {
    throw new Error('Sign in to update plan testing settings.');
  }

  if (!(await canConfigureEntitlementTestPlans(session.user.id))) {
    throw new Error('Sign in to update plan testing settings.');
  }

  const client = getBandieClient();
  const { error } = await client
    .from('bandie_profiles')
    .update({ entitlement_test_organiser_plan_code: planCode })
    .eq('user_id', session.user.id);

  if (error) {
    throw new Error(error.message);
  }

  return getEntitlementTestPlanSettings(session.user.id);
}
