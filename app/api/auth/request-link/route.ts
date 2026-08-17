import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFounderByEmail } from "@/lib/supabase-admin";

// Same response whether or not the email exists. Never confirm membership to a stranger.
const SAME_ANSWER = {
  message: "If that email is on the founding list, a sign-in link is on its way.",
};

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const address = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }

    const founder = await getFounderByEmail(address);
    if (!founder || (founder.status !== "active" && founder.status !== "past_due")) {
      return NextResponse.json(SAME_ANSWER);
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
