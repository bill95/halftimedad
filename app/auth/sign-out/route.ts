import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET so a plain link works without JavaScript. Signing out is not a
 * destructive action worth guarding behind a POST.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?signed_out=1", request.url));
}
