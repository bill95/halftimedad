/**
 * One source of truth for what we charge and what we say we charge.
 *
 * Stripe cannot schedule a price change, so the Oct 1 flip from founding to
 * standard is made here, in the app, by setting NEXT_PUBLIC_ACTIVE_TIER to
 * "standard" in Vercel and redeploying. Nothing else needs to change.
 *
 * Existing subscribers are untouched by that flip. They are billed against
 * the subscription they already hold, at the price they signed up on, which
 * is the founding rate lock we promised.
 */

export type Tier = "founding" | "standard";
export type Plan = "monthly" | "annual";

type PlanPricing = {
  /** Env var holding the Stripe price ID. */
  env: string;
  /** Fallback env var, kept so the live webhook path and .env.local still work. */
  fallbackEnv?: string;
  /** What the site displays. Must match the Stripe price. */
  display: string;
  /** Billing cadence in words, for use next to the amount. */
  cadence: string;
};

export const PRICING: Record<Tier, Record<Plan, PlanPricing>> = {
  founding: {
    monthly: {
      env: "STRIPE_PRICE_FOUNDING_MONTHLY",
      fallbackEnv: "STRIPE_MONTHLY_PRICE_ID",
      display: "$9.99",
      cadence: "a month",
    },
    annual: {
      env: "STRIPE_PRICE_FOUNDING_ANNUAL",
      fallbackEnv: "STRIPE_ANNUAL_PRICE_ID",
      display: "$99",
      cadence: "a year",
    },
  },
  standard: {
    monthly: {
      env: "STRIPE_PRICE_STANDARD_MONTHLY",
      display: "$19",
      cadence: "a month",
    },
    annual: {
      env: "STRIPE_PRICE_STANDARD_ANNUAL",
      display: "$190",
      cadence: "a year",
    },
  },
};

/**
 * Unset means founding, which is today's behavior. An unrecognized value
 * throws rather than quietly falling back, because a typo in this variable
 * would otherwise sell the wrong price without anyone noticing.
 */
export function activeTier(): Tier {
  const raw = (process.env.NEXT_PUBLIC_ACTIVE_TIER ?? "founding").trim().toLowerCase();
  if (raw !== "founding" && raw !== "standard") {
    throw new Error(`NEXT_PUBLIC_ACTIVE_TIER is "${raw}", expected "founding" or "standard"`);
  }
  return raw;
}

export function pricingFor(plan: Plan, tier: Tier = activeTier()) {
  return PRICING[tier][plan];
}
