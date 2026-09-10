import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getPriceId, getStripe } from "@/lib/stripe";
import { claimFounderForUser, getFounderForCheckout, updateFounder } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";

type CheckoutPayload = { plan?: "monthly" | "annual"; email?: string; founderNumber?: number; referralCode?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutPayload;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const founderNumber = Number(body.founderNumber);
    const referralCode = typeof body.referralCode === "string" ? body.referralCode : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || !Number.isInteger(founderNumber) || founderNumber < 1 || founderNumber > 100 || !referralCode) {
      return NextResponse.json({ message: "A valid founding reservation is required before checkout." }, { status: 400 });
    }

    const reservedFounder = await getFounderForCheckout(founderNumber, email, referralCode);
    if (!reservedFounder) return NextResponse.json({ message: "We could not verify this founding reservation." }, { status: 403 });
    if (reservedFounder.stripe_subscription_id && reservedFounder.status !== "cancelled") return NextResponse.json({ message: "This founding membership already has a Stripe subscription." }, { status: 409 });
    // The stored reservation is authoritative. This prevents a remount, retry,
    // or stale browser state from silently switching monthly and annual plans.
    const plan = reservedFounder.plan_interest;

    const stripe = getStripe();
    // Build redirect URLs from the host that received this request. This keeps
    // preview and production checkouts on their own domains and avoids stale or
    // malformed environment values breaking Stripe Checkout.
    const siteUrl = new URL(request.url).origin;
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

    // Upgrading from a free account. The database trigger links by email,
    // which cannot help a man who signed up with one address and pays with
    // another. If he has a session, that session decides who gets access.
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) await claimFounderForUser(founderNumber, user.id);
    } catch (claimError) {
      // Checkout still proceeds. The email trigger is the fallback.
      console.error("Could not attach checkout to the signed-in account", claimError);
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed", error);
    return NextResponse.json({ message: "Secure checkout is temporarily unavailable. Your founder reservation is still saved." }, { status: 503 });
  }
}
