import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";

/**
 * Founding reservation. Creates (or refreshes) the founding_members row that
 * checkout verifies against.
 *
 * An email already on file used to get its founder number and referral code
 * handed straight back, so anyone who knew a member's address could read his
 * number and start a checkout on his row. Now:
 *   - a paid row (active or past_due) gets a generic "sign in" answer and no data
 *   - an unpaid row gets a fresh referral code, which invalidates the old one,
 *     and its plan is updated to whatever was chosen this time
 */

const PAID = ["active", "past_due"];

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function newReferralCode(email: string) {
  return createHash("sha256").update(`${email}:${randomBytes(8).toString("hex")}`).digest("hex").slice(0, 10);
}

export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ message: "Founding enrollment is being connected. Please try again soon." }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Please check the form and try again." }, { status: 400 });
  }

  const email = clean(body.email, 254).toLowerCase();
  const firstName = clean(body.firstName, 80);
  if (!firstName || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ message: "Please enter a first name and valid email." }, { status: 400 });
  }
  const plan = body.plan === "monthly" ? "monthly" : "annual";

  const base = url.replace(/\/$/, "");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  const existingResponse = await fetch(
    `${base}/rest/v1/founding_members?email=eq.${encodeURIComponent(email)}&select=founder_number,status&limit=1`,
    { headers, cache: "no-store" }
  );
  if (!existingResponse.ok) {
    console.error("Supabase founder lookup failed", existingResponse.status);
    return NextResponse.json({ message: "We could not reserve your place. Please try again." }, { status: 502 });
  }
  const [existing] = (await existingResponse.json()) as Array<{ founder_number: number; status: string }>;

  if (existing && PAID.includes(existing.status)) {
    return NextResponse.json(
      { message: "That email already has a founding membership. Sign in to open your dashboard.", alreadyMember: true },
      { status: 409 }
    );
  }

  const referralCode = newReferralCode(email);

  if (existing) {
    const refreshed = await fetch(
      `${base}/rest/v1/founding_members?founder_number=eq.${existing.founder_number}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ referral_code: referralCode, plan_interest: plan, first_name: firstName }),
        cache: "no-store",
      }
    );
    if (!refreshed.ok) {
      console.error("Supabase reservation refresh failed", refreshed.status, await refreshed.text());
      return NextResponse.json({ message: "We could not reserve your place. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ founderNumber: existing.founder_number, referralCode });
  }

  const response = await fetch(`${base}/rest/v1/founding_members`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      first_name: firstName,
      email,
      challenge: clean(body.challenge, 1200) || null,
      plan_interest: plan,
      referred_by: clean(body.referral, 64) || null,
      referral_code: referralCode,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Supabase waitlist insert failed", response.status, detail);
    if (detail.includes("founding_members_founder_number_check")) {
      return NextResponse.json({ message: "The Founding Hundred is full. Join the public-launch list instead." }, { status: 409 });
    }
    return NextResponse.json({ message: "We could not reserve your place. Please try again." }, { status: 502 });
  }

  const [saved] = (await response.json()) as Array<{ founder_number?: number; referral_code?: string }>;
  return NextResponse.json({ founderNumber: saved?.founder_number, referralCode: saved?.referral_code ?? referralCode });
}
