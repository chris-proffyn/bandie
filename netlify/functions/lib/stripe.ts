import Stripe from 'stripe';
import { getStripeSecretKey } from './stripeEnv';
import {
  BANDIE_STRIPE_PLAN_PRICES,
  bandieStripeProductName,
  isBillablePlanCode,
} from './stripePlans';
import type { SupabaseClient } from '@supabase/supabase-js';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }
  return stripeClient;
}

export async function ensureStripePlanCatalogue(admin: SupabaseClient): Promise<
  Record<string, { productId: string; priceId: string }>
> {
  const stripe = getStripeClient();

  const { data: plans, error } = await admin
    .from('bandie_plans')
    .select('id, code, name, stripe_product_id, stripe_price_id')
    .in('code', Object.keys(BANDIE_STRIPE_PLAN_PRICES));

  if (error) {
    throw new Error(error.message);
  }

  const result: Record<string, { productId: string; priceId: string }> = {};

  for (const plan of plans ?? []) {
    const code = plan.code as string;
    if (!isBillablePlanCode(code)) {
      continue;
    }

    const pricing = BANDIE_STRIPE_PLAN_PRICES[code];
    let productId = plan.stripe_product_id as string | null;
    let priceId = plan.stripe_price_id as string | null;

    if (!productId) {
      const product = await stripe.products.create({
        name: bandieStripeProductName(plan.name as string),
        metadata: { platform: 'bandie', bandie_plan_code: code },
      });
      productId = product.id;
    }

    if (!priceId) {
      const price = await stripe.prices.create({
        product: productId,
        currency: pricing.currency,
        unit_amount: pricing.amount,
        recurring: { interval: pricing.interval },
        metadata: { platform: 'bandie', bandie_plan_code: code },
      });
      priceId = price.id;
    }

    if (productId !== plan.stripe_product_id || priceId !== plan.stripe_price_id) {
      const { error: updateError } = await admin
        .from('bandie_plans')
        .update({
          stripe_product_id: productId,
          stripe_price_id: priceId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', plan.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    result[code] = { productId, priceId };
  }

  return result;
}
