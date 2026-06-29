function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getStripeSecretKey(): string {
  return required('STRIPE_SECRET_KEY');
}

export function getStripeWebhookSecret(): string {
  return required('STRIPE_WEBHOOK_SECRET');
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
