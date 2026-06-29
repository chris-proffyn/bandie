import type { Handler, HandlerEvent } from '@netlify/functions';
import { errorResponse, jsonResponse } from './lib/http';
import { ensureStripePlanCatalogue } from './lib/stripe';
import { getSupabaseAdmin, getUserFromBearerToken } from './lib/supabase';
import { isStripeConfigured } from './lib/stripeEnv';

async function userIsAppAdmin(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('platform_user_app_memberships')
    .select('is_app_admin, role')
    .eq('user_id', userId)
    .eq('app_code', 'bandie')
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.is_app_admin) || data?.role === 'admin' || data?.role === 'owner';
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  if (!isStripeConfigured()) {
    return errorResponse('Stripe is not configured on this environment.', 503);
  }

  try {
    const user = await getUserFromBearerToken(new Request('http://localhost', {
      headers: event.headers as HeadersInit,
    }));

    if (!user) {
      return errorResponse('Authentication required.', 401);
    }

    const isAdmin = await userIsAppAdmin(user.id);
    if (!isAdmin) {
      return errorResponse('Platform admin access required.', 403);
    }

    const admin = getSupabaseAdmin();
    const catalogue = await ensureStripePlanCatalogue(admin);

    return jsonResponse({
      ok: true,
      plans: catalogue,
    });
  } catch (err) {
    console.error('billing-setup-stripe-plans failed', err);
    return errorResponse(err instanceof Error ? err.message : 'Unable to sync Stripe plans.', 500);
  }
};
