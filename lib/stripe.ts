import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  stripeClient ??= new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  return stripeClient;
}

export function getPriceId(plan: "monthly" | "annual") {
  const priceId = plan === "monthly"
    ? process.env.STRIPE_MONTHLY_PRICE_ID
    : process.env.STRIPE_ANNUAL_PRICE_ID;
  if (!priceId) throw new Error(`Stripe ${plan} price is not configured`);
  return priceId;
}
