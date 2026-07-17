type FounderUpdate = {
  status?: "interested" | "checkout_pending" | "active" | "past_due" | "cancelled";
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  activated_at?: string | null;
};

export type FounderCheckoutRecord = {
  founder_number: number;
  email: string;
  referral_code: string;
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
  const query = new URLSearchParams({ founder_number: `eq.${founderNumber}`, email: `eq.${email}`, referral_code: `eq.${referralCode}`, select: "founder_number,email,referral_code,status,stripe_customer_id,stripe_subscription_id", limit: "1" });
  const response = await fetch(`${base}/rest/v1/founding_members?${query}`, { headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase founder lookup failed (${response.status})`);
  const [founder] = (await response.json()) as FounderCheckoutRecord[];
  return founder ?? null;
}
