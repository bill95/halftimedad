import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST only.
 *
 * This was a GET so a plain link would work, but Next prefetches links, which
 * meant a member could be signed out by the header scrolling into view. The
 * header posts a form now.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?signed_out=1", request.url), { status: 303 });
}
