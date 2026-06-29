/** GBP monthly prices for paid Bandie plans (amount in minor units — pence). */
export const BANDIE_STRIPE_PLAN_PRICES = {
  player_plus: { amount: 400, currency: 'gbp', name: 'Player Plus', interval: 'month' as const },
  player_pro: { amount: 1000, currency: 'gbp', name: 'Player Pro', interval: 'month' as const },
  organiser_plus: { amount: 1500, currency: 'gbp', name: 'Organiser Plus', interval: 'month' as const },
} as const;

export type BillablePlanCode = keyof typeof BANDIE_STRIPE_PLAN_PRICES;

export function isBillablePlanCode(code: string): code is BillablePlanCode {
  return code in BANDIE_STRIPE_PLAN_PRICES;
}

export function planScopeForCode(code: BillablePlanCode): 'leader' | 'organiser' {
  return code === 'organiser_plus' ? 'organiser' : 'leader';
}

export function freePlanCodeForScope(planScope: 'leader' | 'organiser'): string {
  return planScope === 'organiser' ? 'organiser_free' : 'player_free';
}

/** Customer-facing Stripe product name (matches Dashboard `Bandie — …` convention). */
export const BANDIE_STRIPE_PRODUCT_NAME_PREFIX = 'Bandie — ';

export function bandieStripeProductName(planName: string): string {
  const normalized = planName.trim();
  if (/^bandie\s*[—-]\s*/i.test(normalized)) {
    return normalized;
  }
  return `${BANDIE_STRIPE_PRODUCT_NAME_PREFIX}${normalized}`;
}
