import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weekOf } from "@/lib/member";

const MAX = 4000;

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const text = (key: string) => {
    const value = body[key];
    return typeof value === "string" ? value.trim().slice(0, MAX) : "";
  };

  const row = {
    user_id: user.id,
    week_of: weekOf(),
    holding_up: text("holding_up") || null,
    hardest: text("hardest") || null,
    next_right: text("next_right") || null,
  };

  if (!row.holding_up && !row.hardest && !row.next_right) {
    return NextResponse.json({ message: "Write something in at least one box." }, { status: 400 });
  }

  // One row per member per week. Re-submitting edits that week rather than
  // stacking duplicates.
  const { error } = await supabase
    .from("check_ins")
    .upsert(row, { onConflict: "user_id,week_of" });

  if (error) {
    console.error("Check-in save failed", error);
    return NextResponse.json({ message: "That did not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
