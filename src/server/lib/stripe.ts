import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Lazily-initialized Stripe client. Throws if STRIPE_SECRET_KEY is not
 * configured so callers surface a clear error instead of a silent failure.
 */
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
