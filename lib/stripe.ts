import Stripe from "stripe";
import { activeTier, pricingFor, type Plan, type Tier } from "@/content/pricing";

let stripeClient: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripeClient ??= new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return stripeClient;
}

/**
 * Resolves the Stripe price for a plan at whatever tier is currently active.
 * The tier can be passed explicitly, but in practice it comes from the env var.
 */
export function getPriceId(plan: Plan, tier: Tier = activeTier()) {
  const { env, fallbackEnv } = pricingFor(plan, tier);
  const priceId = process.env[env] ?? (fallbackEnv ? process.env[fallbackEnv] : undefined);
  if (!priceId) {
    throw new Error(`Stripe ${tier} ${plan} price is not configured (expected ${env})`);
  }
  return priceId;
}
