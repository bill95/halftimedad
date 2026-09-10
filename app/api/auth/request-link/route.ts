import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Open to anyone now that free accounts exist. Before, this checked the
// founding list first, which meant a man who wanted to save his Peace
// Monitor count had nowhere to go.
//
// Membership is decided after sign-in, by lib/access.ts and by RLS. Holding
// a session gets you the free half and nothing more.
//
// The old enumeration guard is gone with the gate it protected: everyone
// gets the same answer because everyone gets the same link. Abuse control is
// Supabase's OTP rate limit, which is worth a look in the dashboard before
// this sees real traffic.
const SAME_ANSWER = {
  message: "A sign-in link is on its way.",
};

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const address = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }

    const supabase = await createClient();
    const origin = new URL(request.url).origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) throw error;

    return NextResponse.json(SAME_ANSWER);
  } catch (error) {
    console.error("Sign-in link request failed", error);
    return NextResponse.json({ message: "We could not send that link. Try again shortly." }, { status: 503 });
  }
}
