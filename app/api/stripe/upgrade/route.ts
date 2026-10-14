import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { getAccess } from "@/lib/access";
import { firstTouchSource } from "@/lib/analytics";
import { CheckoutRefused, openFoundingCheckout } from "@/lib/checkout";
import { countIssuedFounders, getFounderRowByEmail, upsertReservation } from "@/lib/supabase-admin";

/**
 * Founding checkout from inside the product (/member/upgrade). The signed-in
 * account supplies the email and is attached to the reservation, so the
 * membership lands on the account he is using no matter which email Stripe
 * ends up with. One tap from his dashboard to Stripe, no homepage detour.
 */

const FOUNDING_LIMIT = 100;

export async function POST(request: Request) {
  const access = await getAccess();
  if (!access) return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  if (access.tier === "paid") return NextResponse.json({ message: "You are already a founding member." }, { status: 409 });
  if (!access.email) return NextResponse.json({ message: "Your account has no email address." }, { status: 400 });

  const body = (await request.json().catch(() => ({}))) as { plan?: unknown; firstName?: unknown };
  const plan = body.plan === "monthly" ? "monthly" : "annual";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  if (!firstName) return NextResponse.json({ message: "Add your first name. It goes on your founder record." }, { status: 400 });

  try {
    const existing = await getFounderRowByEmail(access.email);
    if (!existing && (await countIssuedFounders()) >= FOUNDING_LIMIT) {
      return NextResponse.json({ message: "The Founding Hundred is full." }, { status: 409 });
    }

    // A member's share link (?ref=...) recorded on first visit gets the credit.
    const source = await firstTouchSource();
    const referredBy = source.startsWith("ref:") ? source.slice(4, 68) : null;

    const referralCode = createHash("sha256").update(`${access.email}:${randomBytes(8).toString("hex")}`).digest("hex").slice(0, 10);
    const reservation = await upsertReservation({
      email: access.email,
      first_name: firstName,
      challenge: null,
      plan_interest: plan,
      referral_code: referralCode,
      referred_by: referredBy,
    });

    const url = await openFoundingCheckout({
      reservation,
      referralCode,
      origin: new URL(request.url).origin,
      userId: access.userId,
      cancelPath: "/member/upgrade?checkout=cancelled",
    });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof CheckoutRefused) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("In-app founding checkout failed", error);
    return NextResponse.json({ message: "Secure checkout is temporarily unavailable. Try again in a moment." }, { status: 503 });
  }
}
