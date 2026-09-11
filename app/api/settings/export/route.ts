import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Everything a member has written, in one file.
 *
 * Reads through his own session, so RLS decides what comes out and this route
 * cannot become a way to read somebody else's record.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  const [profile, checkIns, badges, monitor] = await Promise.all([
    supabase.from("member_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("check_ins").select("*").eq("user_id", user.id).order("week_of"),
    supabase.from("member_badges").select("*").eq("user_id", user.id).order("earned_at"),
    supabase.from("monitor_state").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, created_at: user.created_at },
    profile: profile.data ?? null,
    check_ins: checkIns.data ?? [],
    markers: badges.data ?? [],
    peace_monitor: monitor.data ?? null,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="halftimedad-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
