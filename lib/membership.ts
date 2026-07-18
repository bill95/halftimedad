import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { updateFounder } from "@/lib/supabase-admin";

function id(value: string | Stripe.Customer | Stripe.DeletedCustomer | Stripe.Subscription | null) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function subscriptionId(value: string | Stripe.Subscription | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export async function activateCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const founderNumber = session.metadata?.founder_number;
  if (!founderNumber || session.mode !== "subscription" || session.status !== "complete") return session;
  await updateFounder(founderNumber, {
    status: session.payment_status === "unpaid" ? "checkout_pending" : "active",
    stripe_customer_id: id(session.customer),
    stripe_subscription_id: id(session.subscription),
    activated_at: session.payment_status === "unpaid" ? null : new Date().toISOString(),
  });
  return session;
}

export async function syncSubscription(subscription: Stripe.Subscription) {
  const founderNumber = subscription.metadata.founder_number;
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
