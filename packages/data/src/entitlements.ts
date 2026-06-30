import { getBandieClient } from './context';
import { isEntitlementEnforcementEnabled } from './entitlementEnforcement';
import {
  getEntitlementTestPlanSettings,
  shouldApplyEntitlementTestPlanOverride,
} from './entitlementTestPlan';
import { isLaunchPromoSubscription, isLaunchTrialExpired } from './launchPromo';
import { logGateDecision } from './gateLogs';
import { EntitlementGateError } from './entitlementErrors';
import type {
  EntitlementCheckInput,
  EntitlementPlanScope,
  EntitlementSubjectType,
  GateDecision,
  PlanCode,
  UsageMeterEntry,
  UsageSummary,
} from './entitlementTypes';
import { PLAN_CODES, PLAN_DISPLAY_NAMES, UPGRADE_URL } from './entitlementTypes';
import {
  limitCapabilityForMeter,
  measureUsage,
  meterKeyForLimitCapability,
  METER_KEYS,
  METER_LABELS,
} from './usageMeters';

type EntitlementValue = boolean | number | string | null;

type ActiveSubscription = {
  planId: string;
  planCode: string;
  planName: string;
};

const CREATE_CAPABILITY_LIMITS: Record<string, string> = {
  'band.create': 'bands.max_count',
  'song.create': 'songs.max_count',
  'setlist.create': 'setlists.max_count',
  'venue.create': 'venues.max_count',
  'band_members.invite': 'band_members.max_count',
  'gig.create': 'gigs.active_max_count',
};

const REQUIRED_UPGRADE_PLAN: Record<string, PlanCode> = {
  'bands.max_count': PLAN_CODES.PLAYER_PLUS,
  'songs.max_count': PLAN_CODES.PLAYER_PLUS,
  'setlists.max_count': PLAN_CODES.PLAYER_PLUS,
  'band_members.max_count': PLAN_CODES.PLAYER_PLUS,
  'venues.max_count': PLAN_CODES.ORGANISER_PLUS,
  'booking_enquiries.monthly_max_count': PLAN_CODES.ORGANISER_PLUS,
  'gigs.active_max_count': PLAN_CODES.ORGANISER_PLUS,
  'band.create': PLAN_CODES.PLAYER_PLUS,
  'band_directory.browse': PLAN_CODES.PLAYER_PLUS,
  'player_directory.browse': PLAN_CODES.PLAYER_PLUS,
};

const BOOLEAN_CAPABILITY_MESSAGES: Record<string, (planName: string) => string> = {
  'band.create': (planName) =>
    `${planName} accounts join bands by invitation. Upgrade to Player Plus to create your own band.`,
  'band_directory.browse': (planName) =>
    `The band directory is not available on ${planName}. Upgrade to Player Plus to discover bands.`,
  'player_directory.browse': (planName) =>
    `The player directory is not available on ${planName}. Upgrade to Player Plus to find musicians.`,
};

function allowedDecision(partial: Partial<GateDecision> = {}): GateDecision {
  return { ...partial, allowed: true };
}

function deniedDecision(partial: Omit<GateDecision, 'allowed'>): GateDecision {
  return { allowed: false, upgradeUrl: UPGRADE_URL, ...partial };
}

function parseEntitlementValue(raw: unknown): EntitlementValue {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (typeof raw === 'boolean' || typeof raw === 'number' || typeof raw === 'string') {
    return raw;
  }
  return null;
}

function isUnlimitedLimit(value: EntitlementValue): boolean {
  return value === null;
}

function formatLimitMessage(
  capability: string,
  currentPlanName: string,
  usage: number,
  limit: number,
  requiredPlanName: string,
): string {
  switch (capability) {
    case 'bands.max_count':
      return `Your ${currentPlanName} plan includes ${limit} band${limit === 1 ? '' : 's'}. Upgrade to ${requiredPlanName} to lead more bands.`;
    case 'songs.max_count':
      return `Your ${currentPlanName} plan includes ${limit} songs per band. Upgrade to ${requiredPlanName} to add more songs.`;
    case 'setlists.max_count':
      return `Your ${currentPlanName} plan includes ${limit} setlist${limit === 1 ? '' : 's'} per band. Upgrade to ${requiredPlanName} to create more setlists.`;
    case 'venues.max_count':
      return `Your ${currentPlanName} plan includes ${limit} venue${limit === 1 ? '' : 's'}. Upgrade to ${requiredPlanName} to add more venues.`;
    case 'band_members.max_count':
      return `Your ${currentPlanName} plan includes up to ${limit} active members per band. Upgrade to ${requiredPlanName} to grow your lineup.`;
    default:
      return `You have reached the limit (${usage}/${limit}) on your ${currentPlanName} plan. Upgrade to ${requiredPlanName} to continue.`;
  }
}

function resolvePlanScope(input: EntitlementCheckInput): EntitlementPlanScope {
  if (input.planScope) {
    return input.planScope;
  }
  if (
    input.capability.startsWith('venue.') ||
    input.capability.startsWith('organiser_') ||
    input.capability.startsWith('booking_enquiry') ||
    input.capability.startsWith('open_mic') ||
    input.capability.startsWith('event_brief') ||
    input.capability.startsWith('gig.') ||
    input.capability.startsWith('gigs.')
  ) {
    return 'organiser';
  }
  return 'leader';
}

function usageSubjectForCapability(
  capability: string,
  input: EntitlementCheckInput,
  billingUserId: string,
): { subjectType: EntitlementSubjectType; subjectId: string } {
  if (capability === 'bands.max_count' || capability === 'venues.max_count') {
    return { subjectType: 'user', subjectId: billingUserId };
  }
  if (capability === 'booking_enquiries.monthly_max_count') {
    return { subjectType: 'user', subjectId: billingUserId };
  }
  if (capability === 'gigs.active_max_count') {
    return { subjectType: 'user', subjectId: billingUserId };
  }
  return { subjectType: input.subjectType, subjectId: input.subjectId };
}

async function getBandPrimaryLeaderUserId(bandId: string): Promise<string | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_bands')
    .select('owner_user_id')
    .eq('id', bandId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.owner_user_id as string | undefined) ?? null;
}

async function loadPlanByCode(planCode: string): Promise<ActiveSubscription | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_plans')
    .select('id, code, name')
    .eq('code', planCode)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    planId: data.id as string,
    planCode: data.code as string,
    planName: data.name as string,
  };
}

async function loadFreePlanSubscription(
  planScope: EntitlementPlanScope,
): Promise<ActiveSubscription | null> {
  const freeCode = planScope === 'organiser' ? PLAN_CODES.ORGANISER_FREE : PLAN_CODES.PLAYER_FREE;
  return loadPlanByCode(freeCode);
}

async function loadActiveSubscription(
  userId: string,
  planScope: EntitlementPlanScope,
): Promise<ActiveSubscription | null> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_subscriptions')
    .select(
      'plan_id, status, grace_period_ends_at, trial_end, stripe_subscription_id, source, bandie_plans!inner(code, name)',
    )
    .eq('subject_type', 'user')
    .eq('subject_id', userId)
    .eq('plan_scope', planScope)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return loadFreePlanSubscription(planScope);
  }

  if (
    isLaunchTrialExpired(
      data.trial_end as string | null,
      data.stripe_subscription_id as string | null,
    )
  ) {
    return loadFreePlanSubscription(planScope);
  }

  if (data.status === 'past_due') {
    const graceEnds = data.grace_period_ends_at as string | null;
    if (graceEnds && new Date(graceEnds).getTime() <= Date.now()) {
      return loadFreePlanSubscription(planScope);
    }
  }

  const plan = data.bandie_plans as { code: string; name: string } | { code: string; name: string }[];
  const planRow = Array.isArray(plan) ? plan[0] : plan;

  const subscription: ActiveSubscription = {
    planId: data.plan_id as string,
    planCode: planRow.code,
    planName: planRow.name,
  };

  if (planScope === 'leader') {
    const isLaunchPromo = isLaunchPromoSubscription({
      source: data.source as string,
      stripeSubscriptionId: data.stripe_subscription_id as string | null,
    });
    const { leaderPlanCode } = await getEntitlementTestPlanSettings(userId);
    if (
      leaderPlanCode &&
      shouldApplyEntitlementTestPlanOverride(leaderPlanCode, {
        isLaunchPromo,
        enforcementEnabled: isEntitlementEnforcementEnabled(),
      })
    ) {
      const overridden = await loadPlanByCode(leaderPlanCode);
      if (overridden) {
        return overridden;
      }
    }
  }

  return subscription;
}

async function loadPlanEntitlementValue(
  planId: string,
  capabilityKey: string,
): Promise<EntitlementValue | undefined> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_plan_entitlements')
    .select('value')
    .eq('plan_id', planId)
    .eq('capability_key', capabilityKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return undefined;
  }

  return parseEntitlementValue(data.value);
}

async function loadOverrideValue(
  userId: string,
  capabilityKey: string,
): Promise<EntitlementValue | undefined> {
  const client = getBandieClient();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('bandie_entitlement_overrides')
    .select('value')
    .eq('subject_type', 'user')
    .eq('subject_id', userId)
    .eq('capability_key', capabilityKey)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return undefined;
  }

  return parseEntitlementValue(data.value);
}

async function resolveEntitlementValue(
  subscription: ActiveSubscription,
  billingUserId: string,
  capabilityKey: string,
): Promise<EntitlementValue> {
  const override = await loadOverrideValue(billingUserId, capabilityKey);
  if (override !== undefined) {
    return override;
  }

  const planValue = await loadPlanEntitlementValue(subscription.planId, capabilityKey);
  if (planValue !== undefined) {
    return planValue;
  }

  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_capabilities')
    .select('default_value')
    .eq('key', capabilityKey)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return parseEntitlementValue(data?.default_value ?? false);
}

async function evaluateLimitCapability(
  capabilityKey: string,
  entitlementValue: EntitlementValue,
  input: EntitlementCheckInput,
  subscription: ActiveSubscription,
  billingUserId: string,
  requestedAmount: number,
): Promise<GateDecision> {
  if (isUnlimitedLimit(entitlementValue)) {
    return allowedDecision({ currentPlan: subscription.planCode, capability: capabilityKey });
  }

  if (typeof entitlementValue !== 'number') {
    return deniedDecision({
      reasonCode: 'feature_locked',
      message: `Your ${subscription.planName} plan does not include this feature.`,
      currentPlan: subscription.planCode,
      currentPlanName: subscription.planName,
      capability: capabilityKey,
    });
  }

  const meterKey = meterKeyForLimitCapability(capabilityKey);
  if (!meterKey) {
    return allowedDecision({ currentPlan: subscription.planCode, capability: capabilityKey });
  }

  const usageSubject = usageSubjectForCapability(capabilityKey, input, billingUserId);
  const usage = await measureUsage(meterKey, usageSubject.subjectType, usageSubject.subjectId);
  const limit = entitlementValue;

  if (usage + requestedAmount > limit) {
    const requiredPlan = REQUIRED_UPGRADE_PLAN[capabilityKey] ?? PLAN_CODES.PLAYER_PLUS;
    return deniedDecision({
      reasonCode: 'limit_reached',
      message: formatLimitMessage(
        capabilityKey,
        subscription.planName,
        usage,
        limit,
        PLAN_DISPLAY_NAMES[requiredPlan],
      ),
      currentPlan: subscription.planCode,
      currentPlanName: subscription.planName,
      requiredPlan,
      requiredPlanName: PLAN_DISPLAY_NAMES[requiredPlan],
      usage,
      limit,
      capability: capabilityKey,
    });
  }

  return allowedDecision({
    currentPlan: subscription.planCode,
    currentPlanName: subscription.planName,
    usage,
    limit,
    capability: capabilityKey,
  });
}

async function evaluateBooleanCapability(
  capabilityKey: string,
  entitlementValue: EntitlementValue,
  subscription: ActiveSubscription,
): Promise<GateDecision> {
  const enabled = entitlementValue === true;
  if (!enabled) {
    const requiredPlan = REQUIRED_UPGRADE_PLAN[capabilityKey] ?? PLAN_CODES.PLAYER_PLUS;
    const customMessage = BOOLEAN_CAPABILITY_MESSAGES[capabilityKey];
    return deniedDecision({
      reasonCode: 'feature_locked',
      message:
        customMessage?.(subscription.planName) ??
        `This feature is not included on your ${subscription.planName} plan. Upgrade to ${PLAN_DISPLAY_NAMES[requiredPlan]} to unlock it.`,
      currentPlan: subscription.planCode,
      currentPlanName: subscription.planName,
      requiredPlan,
      requiredPlanName: PLAN_DISPLAY_NAMES[requiredPlan],
      capability: capabilityKey,
    });
  }

  return allowedDecision({
    currentPlan: subscription.planCode,
    currentPlanName: subscription.planName,
    capability: capabilityKey,
  });
}

async function resolveBillingUserId(input: EntitlementCheckInput): Promise<string | null> {
  if (input.subjectType === 'user') {
    return input.subjectId;
  }

  if (input.bandId) {
    return getBandPrimaryLeaderUserId(input.bandId);
  }

  if (input.subjectType === 'band') {
    return getBandPrimaryLeaderUserId(input.subjectId);
  }

  return null;
}

export async function canPerform(input: EntitlementCheckInput): Promise<GateDecision> {
  if (!isEntitlementEnforcementEnabled()) {
    return allowedDecision({ capability: input.capability });
  }

  const client = getBandieClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return deniedDecision({
      reasonCode: 'not_authenticated',
      message: 'Sign in to continue.',
      capability: input.capability,
    });
  }

  const billingUserId = await resolveBillingUserId(input);
  if (!billingUserId) {
    return deniedDecision({
      reasonCode: 'plan_missing',
      message: 'We could not determine the band leader for this action.',
      capability: input.capability,
    });
  }

  const planScope = resolvePlanScope(input);
  const subscription = await loadActiveSubscription(billingUserId, planScope);
  if (!subscription) {
    return deniedDecision({
      reasonCode: 'plan_missing',
      message: 'No active plan is assigned to this account.',
      capability: input.capability,
    });
  }

  const requestedAmount = input.requestedAmount ?? 1;
  const limitCapability = CREATE_CAPABILITY_LIMITS[input.capability];
  const capabilityValue = await resolveEntitlementValue(
    subscription,
    billingUserId,
    input.capability,
  );

  if (input.capability.endsWith('.max_count')) {
    return evaluateLimitCapability(
      input.capability,
      capabilityValue,
      input,
      subscription,
      billingUserId,
      requestedAmount,
    );
  }

  if (input.capability === 'calendar.use') {
    const tier = capabilityValue;
    if (tier === 'basic' || tier === 'full') {
      return allowedDecision({
        currentPlan: subscription.planCode,
        currentPlanName: subscription.planName,
        capability: input.capability,
        entitlementValue: tier,
      });
    }

    return deniedDecision({
      reasonCode: 'feature_locked',
      message: `Calendar is not included on your ${subscription.planName} plan.`,
      currentPlan: subscription.planCode,
      currentPlanName: subscription.planName,
      capability: input.capability,
    });
  }

  const booleanDecision = await evaluateBooleanCapability(
    input.capability,
    capabilityValue,
    subscription,
  );

  if (!booleanDecision.allowed || !limitCapability) {
    return booleanDecision;
  }

  const limitValue = await resolveEntitlementValue(subscription, billingUserId, limitCapability);
  return evaluateLimitCapability(
    limitCapability,
    limitValue,
    input,
    subscription,
    billingUserId,
    requestedAmount,
  );
}

export async function assertCanPerform(input: EntitlementCheckInput): Promise<void> {
  const decision = await canPerform(input);
  if (!decision.allowed) {
    await logGateDecision(
      {
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        capability: input.capability,
      },
      decision,
    );
    throw new EntitlementGateError(decision);
  }
}

export async function checkBandLeaderCapability(
  bandId: string,
  capability: string,
  requestedAmount = 1,
): Promise<GateDecision> {
  return canPerform({
    capability,
    subjectType: 'band',
    subjectId: bandId,
    bandId,
    requestedAmount,
    planScope: 'leader',
  });
}

export async function checkUserLeaderCapability(
  userId: string,
  capability: string,
  requestedAmount = 1,
): Promise<GateDecision> {
  return canPerform({
    capability,
    subjectType: 'user',
    subjectId: userId,
    requestedAmount,
    planScope: 'leader',
  });
}

export async function checkUserOrganiserCapability(
  userId: string,
  capability: string,
  requestedAmount = 1,
): Promise<GateDecision> {
  return canPerform({
    capability,
    subjectType: 'user',
    subjectId: userId,
    requestedAmount,
    planScope: 'organiser',
  });
}

export async function getUsageSummaryForUser(
  userId: string,
  planScope: EntitlementPlanScope,
): Promise<UsageSummary | null> {
  const subscription = await loadActiveSubscription(userId, planScope);
  if (!subscription) {
    return null;
  }

  const meterKeys =
    planScope === 'organiser'
      ? [METER_KEYS.VENUES_COUNT, METER_KEYS.BOOKING_ENQUIRIES_SENT]
      : [METER_KEYS.BANDS_COUNT];

  const usage: UsageMeterEntry[] = [];

  for (const meterKey of meterKeys) {
    const limitCapability = limitCapabilityForMeter(meterKey);
    if (!limitCapability) {
      continue;
    }

    const limitValue = await resolveEntitlementValue(subscription, userId, limitCapability);
    const current = await measureUsage(meterKey, 'user', userId);
    const limit = typeof limitValue === 'number' ? limitValue : null;
    usage.push({
      meterKey,
      label: METER_LABELS[meterKey] ?? meterKey,
      current,
      limit,
      status: limit === null ? 'unlimited' : current >= limit ? 'limit_reached' : 'ok',
    });
  }

  return {
    planCode: subscription.planCode,
    planName: subscription.planName,
    planScope,
    usage,
  };
}

export async function getBandUsageSummary(bandId: string): Promise<UsageSummary | null> {
  const leaderId = await getBandPrimaryLeaderUserId(bandId);
  if (!leaderId) {
    return null;
  }

  const subscription = await loadActiveSubscription(leaderId, 'leader');
  if (!subscription) {
    return null;
  }

  const meterKeys = [METER_KEYS.SONGS_COUNT, METER_KEYS.SETLISTS_COUNT, METER_KEYS.BAND_MEMBERS_COUNT];
  const usage: UsageMeterEntry[] = [];

  for (const meterKey of meterKeys) {
    const limitCapability = limitCapabilityForMeter(meterKey);
    if (!limitCapability) {
      continue;
    }

    const limitValue = await resolveEntitlementValue(subscription, leaderId, limitCapability);
    const current = await measureUsage(meterKey, 'band', bandId);
    const limit = typeof limitValue === 'number' ? limitValue : null;

    usage.push({
      meterKey,
      label: METER_LABELS[meterKey] ?? meterKey,
      current,
      limit,
      status: limit === null ? 'unlimited' : current >= limit ? 'limit_reached' : 'ok',
    });
  }

  return {
    planCode: subscription.planCode,
    planName: subscription.planName,
    planScope: 'leader',
    usage,
  };
}

export async function listPublicPlans(): Promise<
  Array<{ code: string; name: string; description: string | null; displayOrder: number }>
> {
  const client = getBandieClient();
  const { data, error } = await client
    .from('bandie_plans')
    .select('code, name, description, display_order')
    .eq('status', 'active')
    .eq('is_public', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    code: row.code as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    displayOrder: row.display_order as number,
  }));
}

export async function ensureDefaultUserSubscriptions(userId: string, isOrganiser = false): Promise<void> {
  const client = getBandieClient();
  const { error } = await client.rpc('bandie_assign_default_user_subscriptions', {
    p_user_id: userId,
    p_is_organiser: isOrganiser,
  });

  if (error) {
    throw new Error(error.message);
  }
}
