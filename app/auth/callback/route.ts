import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { linkFounderUser } from "@/lib/supabase-admin";
import { trackServer } from "@/lib/analytics";

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

  // First sign-in creates the account: Supabase stamps created_at and the
  // first last_sign_in_at in the same exchange, seconds apart.
  const created = Date.parse(data.user.created_at ?? "");
  const lastSignIn = Date.parse(data.user.last_sign_in_at ?? "");
  if (Number.isFinite(created) && Number.isFinite(lastSignIn) && Math.abs(lastSignIn - created) < 10 * 60_000) {
    await trackServer("account_created");
  }

  // /member routes onward from here: profile if it is missing, and the
  // charter when a paid surface is actually requested.
  return NextResponse.redirect(`${origin}/member`);
}
