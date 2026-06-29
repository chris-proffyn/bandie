import type { Handler, HandlerEvent } from '@netlify/functions';
import type Stripe from 'stripe';
import {
  recordWebhookEvent,
  revertUserToFreePlan,
  syncSubscriptionFromStripe,
} from './lib/billingSync';
import { getStripeClient } from './lib/stripe';
import { isBillablePlanCode, planScopeForCode } from './lib/stripePlans';
import { getSupabaseAdmin } from './lib/supabase';
import { getStripeWebhookSecret, isStripeConfigured } from './lib/stripeEnv';
import { errorResponse, jsonResponse } from './lib/http';

function headerValue(headers: HandlerEvent['headers'], name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) {
      return value ?? undefined;
    }
  }
  return undefined;
}

async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  const admin = getSupabaseAdmin();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription' || !session.subscription) {
        return;
      }

      const stripe = getStripeClient();
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['items.data.price.product'],
      });

      const planCode =
        session.metadata?.bandie_plan_code ??
        subscription.metadata?.bandie_plan_code;

      if (planCode && isBillablePlanCode(planCode)) {
        subscription.metadata.bandie_plan_code = planCode;
        subscription.metadata.bandie_plan_scope =
          session.metadata?.bandie_plan_scope ??
          subscription.metadata?.bandie_plan_scope ??
          planScopeForCode(planCode);
        subscription.metadata.bandie_user_id =
          session.metadata?.bandie_user_id ??
          subscription.metadata?.bandie_user_id ??
          session.client_reference_id ??
          '';
      }

      await syncSubscriptionFromStripe(admin, subscription, isBillablePlanCode(planCode ?? '')
        ? planCode
        : undefined);
      return;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionFromStripe(admin, subscription);
      return;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.bandie_user_id;
      const planScope =
        (subscription.metadata.bandie_plan_scope as 'leader' | 'organiser' | undefined) ??
        'leader';
      const customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

      if (userId) {
        await revertUserToFreePlan(admin, userId, planScope, customerId);
      }
      return;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionRef = invoice.subscription;
      if (!subscriptionRef) {
        return;
      }

      const subscriptionId =
        typeof subscriptionRef === 'string' ? subscriptionRef : subscriptionRef.id;
      const stripe = getStripeClient();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscriptionFromStripe(admin, subscription);
      return;
    }

    default:
      return;
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  if (!isStripeConfigured()) {
    return errorResponse('Stripe is not configured.', 503);
  }

  const signature = headerValue(event.headers, 'stripe-signature');
  if (!signature) {
    return errorResponse('Missing Stripe signature.', 400);
  }

  const rawBody = event.body;
  if (!rawBody) {
    return errorResponse('Missing request body.', 400);
  }

  try {
    const stripe = getStripeClient();
    const stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret(),
    );

    const admin = getSupabaseAdmin();
    const isNew = await recordWebhookEvent(
      admin,
      stripeEvent.id,
      stripeEvent.type,
      stripeEvent,
    );

    if (!isNew) {
      return jsonResponse({ received: true, duplicate: true });
    }

    await handleStripeEvent(stripeEvent);
    return jsonResponse({ received: true });
  } catch (err) {
    console.error('billing-stripe-webhook failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Webhook processing failed.', 400);
  }
};
