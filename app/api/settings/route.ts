import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Preference changes. Currently just the Sunday note. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { weekly_nudge?: unknown };
  if (typeof body.weekly_nudge !== "boolean") {
    return NextResponse.json({ message: "Nothing to change." }, { status: 400 });
  }

  const { error } = await supabase
    .from("member_profiles")
    .update({ weekly_nudge: body.weekly_nudge })
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ message: "Could not save." }, { status: 500 });
  return NextResponse.json({ ok: true, weekly_nudge: body.weekly_nudge });
}
