import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { linkFounderUser } from "@/lib/supabase-admin";
import { trackServer } from "@/lib/analytics";
import { sendWelcomeStep } from "@/lib/onboarding";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/login?error=missing_code`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user?.email) {
    console.error("Auth code exchange failed", error);
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  try {
    await linkFounderUser(data.user.email, data.user.id);
  } catch (linkError) {
    // Session is valid; the profile row can be repaired later.
    console.error("Founder link failed after sign-in", linkError);
  }

  // A new account: letter 1 of the free onboarding, and the funnel event.
  // Keyed on the letter's send record rather than on timing, because with
  // email confirmation the first sign-in can come long after created_at. The
  // record makes both happen once per account, however many sign-ins follow.
  const createdMs = Date.parse(data.user.created_at ?? "");
  if (Number.isFinite(createdMs) && Date.now() - createdMs < 3 * 86_400_000) {
    const welcome = await sendWelcomeStep({ id: data.user.id, email: data.user.email, created_at: data.user.created_at });
    if (welcome && welcome.outcome !== "already") await trackServer("account_created");
  }

  // /member routes onward from here: profile if it is missing, and the
  // charter when a paid surface is actually requested.
  return NextResponse.redirect(`${origin}/member`);
}
