import type { Handler, HandlerEvent } from '@netlify/functions';
import { getAppUrl } from './lib/env';
import { errorResponse, jsonResponse } from './lib/http';
import { getStripeClient } from './lib/stripe';
import { getSupabaseAdmin, getUserFromBearerToken } from './lib/supabase';
import { isStripeConfigured } from './lib/stripeEnv';

type PortalBody = {
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

    const body = event.body ? (JSON.parse(event.body) as PortalBody) : {};
    const planScope = body.planScope ?? 'leader';
    const admin = getSupabaseAdmin();

    const { data: subscription, error } = await admin
      .from('bandie_subscriptions')
      .select('stripe_customer_id')
      .eq('subject_type', 'user')
      .eq('subject_id', user.id)
      .eq('plan_scope', planScope)
      .not('stripe_customer_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    let customerId = subscription?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const { data: profile, error: profileError } = await admin
        .from('bandie_profiles')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      customerId = profile?.stripe_customer_id as string | undefined;
    }

    if (!customerId) {
      return errorResponse('No Stripe billing account found for this workspace.', 404);
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getAppUrl()}/app/profile`,
    });

    return jsonResponse({ portalUrl: portalSession.url });
  } catch (err) {
    console.error('billing-create-portal failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to open billing portal.', 500);
  }
};
