import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { weekOf } from "@/lib/member";

const MAX = 4000;

/**
 * holding_up is an integer 1 to 5, bounded by a check constraint. It used to
 * be sent as free text against an integer NOT NULL column, so every check-in
 * ever attempted failed and the table stayed empty.
 */
function scale(value: unknown) {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
}

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

  const holdingUp = scale(body.holding_up);
  if (!holdingUp) {
    return NextResponse.json(
      { message: "Pick where the week landed before you save." },
      { status: 400 }
    );
  }

  const row = {
    user_id: user.id,
    week_of: weekOf(),
    holding_up: holdingUp,
    hardest: text("hardest") || null,
    next_right: text("next_right") || null,
  };

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
