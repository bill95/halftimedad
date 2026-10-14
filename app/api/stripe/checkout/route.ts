import { NextResponse } from "next/server";
import { CheckoutRefused, openFoundingCheckout } from "@/lib/checkout";
import { getReservationForCheckout } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase/server";

/** Founding checkout from the homepage form, after /api/waitlist saved a reservation. */

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

    // Upgrading while signed in: the session decides who gets access, which
    // covers a man who signed up with one address and pays with another.
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

    const url = await openFoundingCheckout({ reservation, referralCode, origin: new URL(request.url).origin, userId });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof CheckoutRefused) return NextResponse.json({ message: error.message }, { status: error.status });
    console.error("Stripe Checkout session creation failed", error);
    return NextResponse.json({ message: "Secure checkout is temporarily unavailable. Your reservation is still saved." }, { status: 503 });
  }
}
