import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { linkFounderUser } from "@/lib/supabase-admin";

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

  return NextResponse.redirect(`${origin}/welcome/charter`);
}
