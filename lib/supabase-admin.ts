type FounderUpdate = {
  status?: "interested" | "checkout_pending" | "active" | "past_due" | "cancelled";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  activated_at?: string | null;
};

type StripeWebhookEvent = {
  id: string;
  type: string;
  created: number;
};

export type FounderCheckoutRecord = {
  founder_number: number;
  email: string;
  referral_code: string;
  plan_interest: "monthly" | "annual";
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin environment is not configured");
  return { base: url.replace(/\/$/, ""), headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

export async function updateFounder(founderNumber: string | number, values: FounderUpdate) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/founding_members?founder_number=eq.${encodeURIComponent(String(founderNumber))}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase founder update failed (${response.status}): ${await response.text()}`);
}

export async function getFounderForCheckout(founderNumber: number, email: string, referralCode: string) {
  const { base, headers } = config();
  const query = new URLSearchParams({ founder_number: `eq.${founderNumber}`, email: `eq.${email}`, referral_code: `eq.${referralCode}`, select: "founder_number,email,referral_code,plan_interest,status,stripe_customer_id,stripe_subscription_id", limit: "1" });
  const response = await fetch(`${base}/rest/v1/founding_members?${query}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase founder lookup failed (${response.status})`);
  const [founder] = (await response.json()) as FounderCheckoutRecord[];
  return founder ?? null;
}

export async function claimStripeWebhookEvent(event: StripeWebhookEvent) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/stripe_webhook_events?on_conflict=event_id`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      event_id: event.id,
      event_type: event.type,
      stripe_created_at: new Date(event.created * 1000).toISOString(),
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase Stripe event claim failed (${response.status})`);
  const inserted = (await response.json()) as Array<{ event_id: string }>;
  return inserted.length === 1;
}

export async function completeStripeWebhookEvent(eventId: string) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/stripe_webhook_events?event_id=eq.${encodeURIComponent(eventId)}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ processed_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase Stripe event completion failed (${response.status})`);
}

export async function releaseStripeWebhookEvent(eventId: string) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/stripe_webhook_events?event_id=eq.${encodeURIComponent(eventId)}&processed_at=is.null`, {
    method: "DELETE",
    headers: { ...headers, Prefer: "return=minimal" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase Stripe event release failed (${response.status})`);
}

export type FounderAuthRecord = {
  founder_number: number;
  email: string;
  status: string;
  user_id: string | null;
};

/** Only active or past_due members may request a login link. */
export async function getFounderByEmail(email: string) {
  const { base, headers } = config();
  const query = new URLSearchParams({
    email: `eq.${email.trim().toLowerCase()}`,
    select: "founder_number,email,status,user_id",
    limit: "1",
  });
  const response = await fetch(`${base}/rest/v1/founding_members?${query}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase founder email lookup failed (${response.status})`);
  const [founder] = (await response.json()) as FounderAuthRecord[];
  return founder ?? null;
}

/** Stamp the auth user onto the founder row and ensure a profile exists. */
export async function linkFounderUser(email: string, userId: string) {
  const { base, headers } = config();

  const link = await fetch(
    `${base}/rest/v1/founding_members?email=eq.${encodeURIComponent(email.trim().toLowerCase())}`,
    {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ user_id: userId }),
      cache: "no-store",
    }
  );
  if (!link.ok) throw new Error(`Supabase founder link failed (${link.status})`);

  const profile = await fetch(`${base}/rest/v1/member_profiles?on_conflict=user_id`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify({ user_id: userId }),
    cache: "no-store",
  });
  if (!profile.ok) throw new Error(`Supabase profile create failed (${profile.status})`);
}
