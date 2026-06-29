import type { Handler, HandlerEvent } from '@netlify/functions';
import { getAppUrl } from './lib/env';
import { errorResponse, jsonResponse } from './lib/http';
import { getOrCreateStripeCustomerId } from './lib/billingSync';
import { ensureStripePlanCatalogue, getStripeClient } from './lib/stripe';
import {
  isBillablePlanCode,
  planScopeForCode,
  type BillablePlanCode,
} from './lib/stripePlans';
import { getSupabaseAdmin, getUserFromBearerToken } from './lib/supabase';
import { isStripeConfigured } from './lib/stripeEnv';

type CheckoutBody = {
  planCode?: string;
  planScope?: 'leader' | 'organiser';
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  if (!isStripeConfigured()) {
    return errorResponse('Billing is not available yet. Stripe is not configured.', 503);
  }

  try {
    const user = await getUserFromBearerToken(new Request('http://localhost', {
      headers: event.headers as HeadersInit,
    }));

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const body = event.body ? (JSON.parse(event.body) as CheckoutBody) : {};
    const planCode = body.planCode?.trim();

    if (!planCode || !isBillablePlanCode(planCode)) {
      return errorResponse('A valid paid plan code is required.', 400);
    }

    const planScope = body.planScope ?? planScopeForCode(planCode as BillablePlanCode);
    const admin = getSupabaseAdmin();
    const catalogue = await ensureStripePlanCatalogue(admin);
    const priceId = catalogue[planCode]?.priceId;

    if (!priceId) {
      return errorResponse('This plan is not available for checkout yet.', 400);
    }

    const stripe = getStripeClient();
    const customerId = await getOrCreateStripeCustomerId(admin, stripe, user.id, user.email);
    const appUrl = getAppUrl();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/app/profile?billing=success&plan_scope=${encodeURIComponent(planScope)}`,
      cancel_url: `${appUrl}/app/profile?billing=cancelled`,
      client_reference_id: user.id,
      metadata: {
        bandie_user_id: user.id,
        bandie_plan_code: planCode,
        bandie_plan_scope: planScope,
      },
      subscription_data: {
        metadata: {
          bandie_user_id: user.id,
          bandie_plan_code: planCode,
          bandie_plan_scope: planScope,
        },
      },
    });

    if (!session.url) {
      return errorResponse('Unable to create checkout session.', 500);
    }

    return jsonResponse({ checkoutUrl: session.url });
  } catch (err) {
    console.error('billing-create-checkout failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to start checkout.', 500);
  }
};
