import { NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { countIssuedFounders, getFounderRowByEmail, upsertReservation } from "@/lib/supabase-admin";

/**
 * Founding reservation. Saves the form and returns what checkout needs to
 * verify it. No founder number is issued here: that happens at payment
 * (lib/membership.ts, public.assign_founder), so an abandoned checkout no
 * longer takes a number out of the hundred.
 *
 * Responses never reveal anything about an email already on file:
 *   - a paid member gets a generic "sign in" message
 *   - anyone else gets a fresh reservation token, which invalidates the old one
 */

const PAID = ["active", "past_due"];
const FOUNDING_LIMIT = 100;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function newReferralCode(email: string) {
  return createHash("sha256").update(`${email}:${randomBytes(8).toString("hex")}`).digest("hex").slice(0, 10);
}

export async function POST(request: Request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

  try {
    const founder = await getFounderRowByEmail(email);
    if (founder && PAID.includes(founder.status)) {
      return NextResponse.json(
        { message: "That email already has a founding membership. Sign in to open your dashboard.", alreadyMember: true },
        { status: 409 }
      );
    }

    // A returning member keeps his number, so only new people need a free seat.
    if (!founder && (await countIssuedFounders()) >= FOUNDING_LIMIT) {
      return NextResponse.json({ message: "The Founding Hundred is full. Join the public-launch list instead." }, { status: 409 });
    }

    const reservation = await upsertReservation({
      email,
      first_name: firstName,
      challenge: clean(body.challenge, 1200) || null,
      plan_interest: body.plan === "monthly" ? "monthly" : "annual",
      referral_code: newReferralCode(email),
      referred_by: clean(body.referral, 64) || null,
    });

    return NextResponse.json({ reservationId: reservation.id, referralCode: reservation.referral_code });
  } catch (error) {
    console.error("Founding reservation failed", error);
    return NextResponse.json({ message: "We could not reserve your place. Please try again." }, { status: 502 });
  }
}
