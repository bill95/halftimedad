import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getPriceId, getStripe } from "@/lib/stripe";
import { getFounderForCheckout, updateFounder } from "@/lib/supabase-admin";

type CheckoutPayload = { plan?: "monthly" | "annual"; email?: string; founderNumber?: number; referralCode?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutPayload;
    const plan = body.plan === "monthly" ? "monthly" : "annual";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const founderNumber = Number(body.founderNumber);
    const referralCode = typeof body.referralCode === "string" ? body.referralCode : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || !Number.isInteger(founderNumber) || founderNumber < 1 || founderNumber > 100 || !referralCode) {
      return NextResponse.json({ message: "A valid founding reservation is required before checkout." }, { status: 400 });
    }

    const reservedFounder = await getFounderForCheckout(founderNumber, email, referralCode);
    if (!reservedFounder) return NextResponse.json({ message: "We could not verify this founding reservation." }, { status: 403 });
    if (reservedFounder.stripe_subscription_id && reservedFounder.status !== "cancelled") return NextResponse.json({ message: "This founding membership already has a Stripe subscription." }, { status: 409 });

    const stripe = getStripe();
    const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
    const siteUrl = configuredSite || new URL(request.url).origin;
    const founder = String(founderNumber);
    const identifierSuffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");
    const session = await stripe.checkout.sessions.create({
      integration_identifier: `halftimedad_web_${identifierSuffix}`,
      mode: "subscription",
      ...(reservedFounder.stripe_customer_id ? { customer: reservedFounder.stripe_customer_id } : { customer_email: email }),
      client_reference_id: founder,
      line_items: [{ price: getPriceId(plan), quantity: 1 }],
      success_url: `${siteUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?checkout=cancelled#join`,
      allow_promotion_codes: false,
      billing_address_collection: "auto",
      submit_type: "subscribe",
      metadata: { founder_number: founder, founding_plan: plan, referral_code: referralCode },
      subscription_data: { metadata: { founder_number: founder, founding_plan: plan } },
      custom_text: { submit: { message: "Founding pricing remains locked while your membership stays active. Cancel anytime." } },
    });

    await updateFounder(founderNumber, { status: "checkout_pending" });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed", error);
    return NextResponse.json({ message: "Secure checkout is temporarily unavailable. Your founder reservation is still saved." }, { status: 503 });
  }
}
