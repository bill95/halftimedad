import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getPriceId, getStripe } from "@/lib/stripe";
import { getFounderRowByEmail, getReservationForCheckout, updateReservation } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";
import { firstTouchSource } from "@/lib/analytics";

type CheckoutPayload = { email?: string; reservationId?: string; referralCode?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutPayload;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const reservationId = typeof body.reservationId === "string" ? body.reservationId : "";
    const referralCode = typeof body.referralCode === "string" ? body.referralCode : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || !UUID.test(reservationId) || !referralCode) {
      return NextResponse.json({ message: "A valid founding reservation is required before checkout." }, { status: 400 });
    }

    const reservation = await getReservationForCheckout(reservationId, email, referralCode);
    if (!reservation) return NextResponse.json({ message: "We could not verify this founding reservation." }, { status: 403 });
    if (reservation.status === "converted") {
      return NextResponse.json({ message: "This reservation is already a founding membership. Sign in to open your dashboard." }, { status: 409 });
    }

    // Someone who was a member before (cancelled, now rejoining) reuses his
    // Stripe customer and keeps his founder number at payment.
    const previous = await getFounderRowByEmail(email);
    if (previous?.stripe_subscription_id && previous.status !== "cancelled") {
      return NextResponse.json({ message: "This founding membership already has a Stripe subscription." }, { status: 409 });
    }

    // The stored reservation is authoritative. This prevents a remount, retry,
    // or stale browser state from silently switching monthly and annual plans.
    const plan = reservation.plan_interest;

    const stripe = getStripe();
    // First-touch attribution rides along so the webhook can credit the sale.
    const source = await firstTouchSource();
    // Build redirect URLs from the host that received this request. This keeps
    // preview and production checkouts on their own domains.
    const siteUrl = new URL(request.url).origin;
    const identifierSuffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
    const session = await stripe.checkout.sessions.create({
      integration_identifier: `halftimedad_web_${identifierSuffix}`,
      mode: "subscription",
      ...(previous?.stripe_customer_id ? { customer: previous.stripe_customer_id } : { customer_email: email }),
      client_reference_id: reservation.id,
      line_items: [{ price: getPriceId(plan), quantity: 1 }],
      success_url: `${siteUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled#join`,
      // Creator and partner codes (Stripe > Product catalog > Coupons > Promotion codes).
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      submit_type: "subscribe",
      metadata: { reservation_id: reservation.id, founding_plan: plan, referral_code: referralCode, source },
      // founder_number is added to the subscription once payment clears.
      subscription_data: { metadata: { reservation_id: reservation.id, founding_plan: plan } },
      custom_text: { submit: { message: "Founding pricing remains locked while your membership stays active. Cancel anytime." } },
    });

    // Upgrading from a free account: the session decides who gets access,
    // which covers a man who signed up with one address and pays with another.
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch (claimError) {
      console.error("Could not read the signed-in account at checkout", claimError);
    }
    await updateReservation(reservation.id, { status: "checkout_pending", ...(userId ? { user_id: userId } : {}) });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed", error);
    return NextResponse.json({ message: "Secure checkout is temporarily unavailable. Your reservation is still saved." }, { status: 503 });
  }
}
