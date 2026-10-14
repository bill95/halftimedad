import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { assignFounder, getFounderNumberForReservation, updateFounder } from "@/lib/supabase-admin";

function id(value: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionId(value: string | Stripe.Subscription | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export type Activation = {
  session: Stripe.Checkout.Session;
  /** Null until the payment has cleared. */
  founderNumber: string | null;
};

/**
 * Called by the Stripe webhook and by /welcome, whichever lands first. Both
 * are safe to run for the same session: assign_founder locks the reservation
 * and returns the same number the second time.
 *
 * Two kinds of session exist:
 *   - reservation_id in metadata: the current flow. The founder number is
 *     issued here, at payment, and stamped onto the subscription so later
 *     subscription events can find the row.
 *   - founder_number in metadata: sessions created before founder numbers
 *     moved to payment. Kept so any still in flight activate normally.
 */
export async function activateCheckoutSession(sessionId: string): Promise<Activation> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.mode !== "subscription" || session.status !== "complete") return { session, founderNumber: null };

  const paid = session.payment_status !== "unpaid";
  const reservationId = session.metadata?.reservation_id;

  if (reservationId) {
    if (!paid) return { session, founderNumber: null };
    const number = await assignFounder(reservationId, id(session.customer), id(session.subscription));
    const subId = id(session.subscription);
    if (subId) {
      await stripe.subscriptions.update(subId, {
        metadata: { founder_number: String(number), reservation_id: reservationId, founding_plan: session.metadata?.founding_plan ?? "" },
      });
    }
    return { session, founderNumber: String(number) };
  }

  const legacyNumber = session.metadata?.founder_number;
  if (!legacyNumber) return { session, founderNumber: null };
  await updateFounder(legacyNumber, {
    status: paid ? "active" : "checkout_pending",
    stripe_customer_id: id(session.customer),
    stripe_subscription_id: id(session.subscription),
    activated_at: paid ? new Date().toISOString() : null,
  });
  return { session, founderNumber: paid ? legacyNumber : null };
}

async function founderNumberFor(subscription: Stripe.Subscription) {
  if (subscription.metadata.founder_number) return subscription.metadata.founder_number;
  // A subscription event can arrive before checkout.session.completed has
  // stamped the number on. The reservation knows it once assigned.
  const reservationId = subscription.metadata.reservation_id;
  if (!reservationId) return null;
  const number = await getFounderNumberForReservation(reservationId);
  return number ? String(number) : null;
}

export async function syncSubscription(subscription: Stripe.Subscription) {
  const founderNumber = await founderNumberFor(subscription);
  // Not yet assigned: checkout.session.completed will create the row as active.
  if (!founderNumber) return;
  const active = subscription.status === "active" || subscription.status === "trialing";
  const pastDue = subscription.status === "past_due" || subscription.status === "unpaid";
  await updateFounder(founderNumber, {
    status: active ? "active" : pastDue ? "past_due" : "cancelled",
    stripe_customer_id: id(subscription.customer),
    stripe_subscription_id: subscription.id,
  });
}

export async function syncCurrentSubscription(subscription: string | Stripe.Subscription | null | undefined) {
  const currentId = subscriptionId(subscription);
  if (!currentId) return;
  const current = await getStripe().subscriptions.retrieve(currentId);
  await syncSubscription(current);
}

export async function syncCheckoutFailure(sessionId: string) {
  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  await syncCurrentSubscription(session.subscription);
}

export async function syncInvoiceSubscription(invoice: Stripe.Invoice) {
  await syncCurrentSubscription(invoice.parent?.subscription_details?.subscription);
}
