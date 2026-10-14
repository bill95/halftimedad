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

/** Stamp the auth user onto the founder row and ensure a profile exists. */
export async function linkFounderUser(email: string, userId: string) {
  const { base, headers } = config();

  const link = await fetch(
    `${base}/rest/v1/founding_members?email=eq.${encodeURIComponent(email.trim().toLowerCase())}&user_id=is.null`,
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

/**
 * Profile writes run as the service role.
 *
 * Members no longer hold INSERT or UPDATE on member_profiles beyond the
 * Sunday-email preference, because charter_accepted_at sitting behind a
 * member's own key made the charter record self-attestable. These helpers are
 * the only path in, and they patch rather than replace: the old route nulled
 * every column it was not given, so changing one answer wiped the other three.
 */
export async function patchProfile(userId: string, patch: Record<string, unknown>) {
  const { base, headers } = config();

  const existing = await fetch(
    `${base}/rest/v1/member_profiles?user_id=eq.${userId}&select=user_id`,
    { headers, cache: "no-store" }
  );
  if (!existing.ok) throw new Error(`Supabase profile lookup failed (${existing.status})`);
  const rows = (await existing.json()) as unknown[];

  const response = rows.length
    ? await fetch(`${base}/rest/v1/member_profiles?user_id=eq.${userId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(patch),
        cache: "no-store",
      })
    : await fetch(`${base}/rest/v1/member_profiles`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: userId, ...patch }),
        cache: "no-store",
      });

  if (!response.ok) throw new Error(`Supabase profile write failed (${response.status}): ${await response.text()}`);
}

/** First name on a founder row, for the welcome email. */
export async function getFounderFirstName(founderNumber: string | number) {
  const { base, headers } = config();
  const response = await fetch(
    `${base}/rest/v1/founding_members?founder_number=eq.${encodeURIComponent(String(founderNumber))}&select=first_name&limit=1`,
    { headers, cache: "no-store" }
  );
  if (!response.ok) return null;
  const [row] = (await response.json()) as Array<{ first_name: string | null }>;
  return row?.first_name ?? null;
}

/* ------------------------------------------------------------------------ *
 * Founding reservations (supabase/2026-10-14-founder-numbers-at-payment.sql)
 *
 * The homepage form reserves a place without a number. The number is issued
 * by public.assign_founder once Stripe says the payment cleared.
 * ------------------------------------------------------------------------ */

export type Reservation = {
  id: string;
  email: string;
  first_name: string;
  plan_interest: "monthly" | "annual";
  referral_code: string;
  status: "reserved" | "checkout_pending" | "converted";
  founder_number: number | null;
};

const RESERVATION_FIELDS = "id,email,first_name,plan_interest,referral_code,status,founder_number";

/** The founding row for an email, if there is one (any status). */
export async function getFounderRowByEmail(email: string) {
  const { base, headers } = config();
  const query = new URLSearchParams({
    email: `eq.${email.trim().toLowerCase()}`,
    select: "founder_number,status,stripe_customer_id,stripe_subscription_id",
    limit: "1",
  });
  const response = await fetch(`${base}/rest/v1/founding_members?${query}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase founder email lookup failed (${response.status})`);
  const [row] = (await response.json()) as Array<{
    founder_number: number;
    status: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
  }>;
  return row ?? null;
}

/** How many founder numbers have been issued to people who paid. */
export async function countIssuedFounders() {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/founding_members?select=founder_number`, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase founder count failed (${response.status})`);
  const total = response.headers.get("content-range")?.split("/")[1];
  return Number(total ?? 0);
}

/**
 * Create or refresh the reservation for an email. Every call rotates the
 * referral code, so a stale browser (or someone who only knows the email)
 * cannot reuse an old one at checkout.
 */
export async function upsertReservation(values: {
  email: string;
  first_name: string;
  challenge: string | null;
  plan_interest: "monthly" | "annual";
  referral_code: string;
  referred_by: string | null;
}) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/founding_reservations?on_conflict=email&select=${RESERVATION_FIELDS}`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ ...values, email: values.email.trim().toLowerCase(), status: "reserved", updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase reservation upsert failed (${response.status}): ${await response.text()}`);
  const [row] = (await response.json()) as Reservation[];
  return row;
}

export async function getReservationForCheckout(id: string, email: string, referralCode: string) {
  const { base, headers } = config();
  const query = new URLSearchParams({
    id: `eq.${id}`,
    email: `eq.${email.trim().toLowerCase()}`,
    referral_code: `eq.${referralCode}`,
    select: RESERVATION_FIELDS,
    limit: "1",
  });
  const response = await fetch(`${base}/rest/v1/founding_reservations?${query}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase reservation lookup failed (${response.status})`);
  const [row] = (await response.json()) as Reservation[];
  return row ?? null;
}

export async function updateReservation(id: string, values: { status?: Reservation["status"]; user_id?: string }) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/founding_reservations?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase reservation update failed (${response.status})`);
}

/** Issues (or returns the already-issued) founder number for a paid reservation. */
export async function assignFounder(reservationId: string, customerId: string | null, subscriptionId: string | null) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/rpc/assign_founder`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ p_reservation: reservationId, p_customer: customerId, p_subscription: subscriptionId }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase assign_founder failed (${response.status}): ${await response.text()}`);
  return Number(await response.json());
}

/** Founder number a reservation converted into, for subscriptions created before metadata was stamped. */
export async function getFounderNumberForReservation(reservationId: string) {
  const { base, headers } = config();
  const response = await fetch(
    `${base}/rest/v1/founding_reservations?id=eq.${encodeURIComponent(reservationId)}&select=founder_number&limit=1`,
    { headers, cache: "no-store" }
  );
  if (!response.ok) return null;
  const [row] = (await response.json()) as Array<{ founder_number: number | null }>;
  return row?.founder_number ?? null;
}

/* ------------------------------------------------------------------------ *
 * Member writes the database grants do not allow.
 *
 * On monitor_state and script_usage, members hold SELECT only, and on
 * member_badges they have no DELETE. The row policies would allow these writes but
 * the grants stop them first, so they failed in production: saving a Peace
 * Monitor count, recording a Script rewrite (which meant the free and paid
 * limits never counted anything), and unclaiming a passage.
 *
 * Each caller verifies the member from his own session first, then writes
 * through here with that user id. Nothing here trusts a user id from a request body.
 * ------------------------------------------------------------------------ */

export async function upsertMonitorState(row: {
  user_id: string;
  streak_started_at: string;
  longest_streak: number;
  lifetime_resets: number;
  total_clean_days: number;
  adopted_local_at: string | null;
}) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/monitor_state?on_conflict=user_id`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase monitor upsert failed (${response.status}): ${await response.text()}`);
}

export async function logScriptUsage(row: {
  user_id: string;
  channel: string;
  outcome: string;
  input_chars: number;
  output_chars: number;
  was_paid: boolean;
}) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/script_usage`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase script usage insert failed (${response.status}): ${await response.text()}`);
}

/** Removes a self-claimed passage. Tenure and founding badges cannot be removed this way. */
export async function unclaimPassage(userId: string, slug: string) {
  const { base, headers } = config();
  const badge = await fetch(
    `${base}/rest/v1/badges?slug=eq.${encodeURIComponent(slug)}&self_claim=is.true&select=slug&limit=1`,
    { headers, cache: "no-store" }
  );
  if (!badge.ok) throw new Error(`Supabase badge lookup failed (${badge.status})`);
  if (((await badge.json()) as unknown[]).length === 0) return false;

  const response = await fetch(
    `${base}/rest/v1/member_badges?user_id=eq.${encodeURIComponent(userId)}&badge_slug=eq.${encodeURIComponent(slug)}`,
    { method: "DELETE", headers: { ...headers, Prefer: "return=minimal" }, cache: "no-store" }
  );
  if (!response.ok) throw new Error(`Supabase passage delete failed (${response.status})`);
  return true;
}

/* ------------------------------------------------------------------------ *
 * Anonymous Script trials (supabase/2026-10-14-script-trials.sql)
 * ------------------------------------------------------------------------ */

export async function countRows(table: string, filters: Record<string, string>) {
  const { base, headers } = config();
  const query = new URLSearchParams({ select: "*", ...filters });
  const response = await fetch(`${base}/rest/v1/${table}?${query}`, {
    headers: { ...headers, Prefer: "count=exact", Range: "0-0" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase count on ${table} failed (${response.status})`);
  return Number(response.headers.get("content-range")?.split("/")[1] ?? 0);
}

export async function countScriptTrials(sinceIso: string, visitor?: string) {
  return countRows("script_trials", {
    created_at: `gte.${sinceIso}`,
    ...(visitor ? { visitor: `eq.${visitor}` } : {}),
  });
}

export async function logScriptTrial(row: {
  visitor: string;
  channel: string;
  outcome: string;
  input_chars: number;
  output_chars: number;
}) {
  const { base, headers } = config();
  const response = await fetch(`${base}/rest/v1/script_trials`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(row),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Supabase script trial insert failed (${response.status}): ${await response.text()}`);
}

/** A published library piece, read past the member-only policy. Callers must check content/public-assets.ts first. */
export async function getPublishedAssetAsAdmin(slug: string) {
  const { base, headers } = config();
  const query = new URLSearchParams({
    slug: `eq.${slug}`,
    published: "is.true",
    select: "slug,title,dek,kind,duration_min,body_md,published_at",
    limit: "1",
  });
  const response = await fetch(`${base}/rest/v1/assets?${query}`, { headers, next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(`Supabase public asset read failed (${response.status})`);
  const [row] = (await response.json()) as Array<{
    slug: string;
    title: string;
    dek: string | null;
    kind: "guide" | "play" | "script";
    duration_min: number;
    body_md: string | null;
    published_at: string | null;
  }>;
  return row ?? null;
}
