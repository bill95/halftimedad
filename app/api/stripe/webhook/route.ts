import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { activateCheckoutSession, syncSubscription } from "@/lib/membership";
import { getStripe } from "@/lib/stripe";

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await activateCheckoutSession((event.data.object as Stripe.Checkout.Session).id);
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Stripe webhook processing failed for ${event.id}`, error);
    return NextResponse.json({ message: "Webhook processing failed." }, { status: 500 });
  }
}
