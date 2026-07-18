import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { activateCheckoutSession, syncCheckoutFailure, syncCurrentSubscription, syncInvoiceSubscription } from "@/lib/membership";
import { getStripe } from "@/lib/stripe";
import { claimStripeWebhookEvent, completeStripeWebhookEvent, releaseStripeWebhookEvent } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ message: "Webhook is not configured." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ message: "Invalid webhook signature." }, { status: 400 });
  }

  let claimed = false;
  try {
    claimed = await claimStripeWebhookEvent(event);
    if (!claimed) return NextResponse.json({ received: true, duplicate: true });

    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await activateCheckoutSession((event.data.object as Stripe.Checkout.Session).id);
        break;
      case "checkout.session.async_payment_failed":
        await syncCheckoutFailure((event.data.object as Stripe.Checkout.Session).id);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncCurrentSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.finalization_failed":
        await syncInvoiceSubscription(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
    await completeStripeWebhookEvent(event.id);
    return NextResponse.json({ received: true });
  } catch (error) {
    if (claimed) {
      try {
        await releaseStripeWebhookEvent(event.id);
      } catch (releaseError) {
        console.error(`Could not release Stripe webhook claim for ${event.id}`, releaseError);
      }
    }
    console.error(`Stripe webhook processing failed for ${event.id}`, error);
    return NextResponse.json({ message: "Webhook processing failed." }, { status: 500 });
  }
}
