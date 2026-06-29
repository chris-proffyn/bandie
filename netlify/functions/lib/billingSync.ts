import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { freePlanCodeForScope, type BillablePlanCode } from './stripePlans';

const GRACE_PERIOD_DAYS = 7;

export function mapStripeSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status,
): 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'cancelled';
    case 'incomplete_expired':
      return 'expired';
    case 'paused':
      return 'cancelled';
    default:
      return 'active';
  }
}

function gracePeriodEndsAt(from: Date = new Date()): string {
  const ends = new Date(from);
  ends.setUTCDate(ends.getUTCDate() + GRACE_PERIOD_DAYS);
  return ends.toISOString();
}

type PlanRow = { id: string; code: string };

async function loadPlanByCode(admin: SupabaseClient, code: string): Promise<PlanRow | null> {
  const { data, error } = await admin
    .from('bandie_plans')
    .select('id, code')
    .eq('code', code)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PlanRow | null) ?? null;
}

async function setProfileStripeCustomerId(
  admin: SupabaseClient,
  userId: string,
  customerId: string,
): Promise<void> {
  const { error } = await admin
    .from('bandie_profiles')
    .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getOrCreateStripeCustomerId(
  admin: SupabaseClient,
  stripe: Stripe,
  userId: string,
  email: string | null | undefined,
): Promise<string> {
  const { data: profile, error } = await admin
    .from('bandie_profiles')
    .select('stripe_customer_id, display_name')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const existing = profile?.stripe_customer_id as string | undefined;
  if (existing) {
    return existing;
  }

  const customer = await stripe.customers.create({
    email: email ?? undefined,
    name: (profile?.display_name as string | undefined) ?? undefined,
    metadata: { bandie_user_id: userId },
  });

  await setProfileStripeCustomerId(admin, userId, customer.id);
  return customer.id;
}

export async function upsertStripeSubscription(
  admin: SupabaseClient,
  input: {
    userId: string;
    planScope: 'leader' | 'organiser';
    planCode: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    trialEnd: string | null;
    cancelAtPeriodEnd: boolean;
    gracePeriodEndsAt?: string | null;
  },
): Promise<void> {
  const plan = await loadPlanByCode(admin, input.planCode);
  if (!plan) {
    throw new Error(`Plan ${input.planCode} is not configured.`);
  }

  const { data: existing, error: existingError } = await admin
    .from('bandie_subscriptions')
    .select('id')
    .eq('subject_type', 'user')
    .eq('subject_id', input.userId)
    .eq('plan_scope', input.planScope)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const row = {
    subject_type: 'user',
    subject_id: input.userId,
    plan_id: plan.id,
    plan_scope: input.planScope,
    status: input.status,
    source: 'stripe',
    stripe_customer_id: input.stripeCustomerId,
    stripe_subscription_id: input.stripeSubscriptionId,
    current_period_start: input.currentPeriodStart,
    current_period_end: input.currentPeriodEnd,
    trial_end: input.trialEnd,
    cancel_at_period_end: input.cancelAtPeriodEnd,
    grace_period_ends_at: input.gracePeriodEndsAt ?? null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin.from('bandie_subscriptions').update(row).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await admin.from('bandie_subscriptions').insert(row);
  if (error) {
    throw new Error(error.message);
  }
}

export async function revertUserToFreePlan(
  admin: SupabaseClient,
  userId: string,
  planScope: 'leader' | 'organiser',
  stripeCustomerId?: string | null,
): Promise<void> {
  const freeCode = freePlanCodeForScope(planScope);
  const freePlan = await loadPlanByCode(admin, freeCode);
  if (!freePlan) {
    throw new Error(`Free plan ${freeCode} is not configured.`);
  }

  const { data: existing, error: existingError } = await admin
    .from('bandie_subscriptions')
    .select('id')
    .eq('subject_type', 'user')
    .eq('subject_id', userId)
    .eq('plan_scope', planScope)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const row = {
    plan_id: freePlan.id,
    status: 'active',
    source: 'stripe',
    stripe_customer_id: stripeCustomerId ?? null,
    stripe_subscription_id: null,
    current_period_start: null,
    current_period_end: null,
    trial_end: null,
    cancel_at_period_end: false,
    grace_period_ends_at: null,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin.from('bandie_subscriptions').update(row).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await admin.from('bandie_subscriptions').insert({
    ...row,
    subject_type: 'user',
    subject_id: userId,
    plan_scope: planScope,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncSubscriptionFromStripe(
  admin: SupabaseClient,
  subscription: Stripe.Subscription,
  fallbackPlanCode?: BillablePlanCode,
): Promise<void> {
  const userId =
    subscription.metadata.bandie_user_id ??
    (subscription.metadata as Record<string, string>).user_id;
  const planScope =
    (subscription.metadata.bandie_plan_scope as 'leader' | 'organiser' | undefined) ??
    'leader';
  const planCode =
    subscription.metadata.bandie_plan_code ??
    fallbackPlanCode ??
    null;

  if (!userId || !planCode) {
    throw new Error('Stripe subscription missing bandie_user_id or bandie_plan_code metadata.');
  }

  const status = mapStripeSubscriptionStatus(subscription.status);
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

  if (status === 'cancelled' || status === 'expired') {
    await revertUserToFreePlan(admin, userId, planScope, customerId);
    return;
  }

  const firstItem = subscription.items.data[0];
  const periodStart =
    subscription.current_period_start != null
      ? new Date(subscription.current_period_start * 1000).toISOString()
      : firstItem?.current_period_start
        ? new Date(firstItem.current_period_start * 1000).toISOString()
        : null;
  const periodEnd =
    subscription.current_period_end != null
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000).toISOString()
        : null;

  await upsertStripeSubscription(admin, {
    userId,
    planScope,
    planCode,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    status,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    gracePeriodEndsAt: status === 'past_due' ? gracePeriodEndsAt() : null,
  });

  await setProfileStripeCustomerId(admin, userId, customerId);
}

export async function recordWebhookEvent(
  admin: SupabaseClient,
  stripeEventId: string,
  eventType: string,
  payload: unknown,
): Promise<boolean> {
  const { error } = await admin.from('bandie_stripe_webhook_events').insert({
    stripe_event_id: stripeEventId,
    event_type: eventType,
    payload: payload as Record<string, unknown>,
  });

  if (error) {
    if (error.code === '23505') {
      return false;
    }
    throw new Error(error.message);
  }

  return true;
}
