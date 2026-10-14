import { randomBytes } from "node:crypto";
import { getPriceId, getStripe } from "@/lib/stripe";
import { getFounderRowByEmail, updateReservation, type Reservation } from "@/lib/supabase-admin";
import { firstTouchSource } from "@/lib/analytics";

/**
 * One way to open a founding checkout, used by the homepage form
 * (/api/stripe/checkout) and the in-app upgrade (/api/stripe/upgrade).
 *
 * The reservation carries the plan, so a stale browser cannot switch plans
 * at the last second. The founder number is issued at payment, not here.
 */

export class CheckoutRefused extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function openFoundingCheckout(opts: {
  reservation: Reservation;
  referralCode: string;
  /** Origin of the incoming request, so previews redirect to previews. */
  origin: string;
  /** Signed-in account, if any. Wins over email matching at payment. */
  userId?: string;
  /** Where Stripe's back button returns to. */
  cancelPath?: string;
}) {
  const { reservation, referralCode, origin, userId } = opts;

  if (reservation.status === "converted") {
    throw new CheckoutRefused("This reservation is already a founding membership. Sign in to open your dashboard.", 409);
  }

  // Someone who was a member before (cancelled, now rejoining) reuses his
  // Stripe customer and keeps his founder number at payment.
  const previous = await getFounderRowByEmail(reservation.email);
  if (previous?.stripe_subscription_id && previous.status !== "cancelled") {
    throw new CheckoutRefused("This founding membership already has a Stripe subscription.", 409);
  }

  const plan = reservation.plan_interest;
  const source = await firstTouchSource();
  const identifierSuffix = Array.from(randomBytes(8), (byte) => String.fromCharCode(97 + (byte % 26))).join("");

  const session = await getStripe().checkout.sessions.create({
    integration_identifier: `halftimedad_web_${identifierSuffix}`,
    mode: "subscription",
    ...(previous?.stripe_customer_id ? { customer: previous.stripe_customer_id } : { customer_email: reservation.email }),
    client_reference_id: reservation.id,
    line_items: [{ price: getPriceId(plan), quantity: 1 }],
    success_url: `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}${opts.cancelPath ?? "/?checkout=cancelled#join"}`,
    // Creator and partner codes (Stripe > Product catalog > Coupons > Promotion codes).
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    submit_type: "subscribe",
    metadata: { reservation_id: reservation.id, founding_plan: plan, referral_code: referralCode, source },
    // founder_number is added to the subscription once payment clears.
    subscription_data: { metadata: { reservation_id: reservation.id, founding_plan: plan } },
    custom_text: { submit: { message: "Founding pricing remains locked while your membership stays active. Cancel anytime." } },
  });

  await updateReservation(reservation.id, { status: "checkout_pending", ...(userId ? { user_id: userId } : {}) });

  if (!session.url) throw new Error("Stripe returned no checkout URL");
  return session.url;
}
