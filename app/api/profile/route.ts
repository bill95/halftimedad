import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CONFLICT, CUSTODY, FOCUS_AREAS, STAGES } from "@/content/profile-options";

const ALLOWED: Record<string, string[]> = {
  stage: STAGES.map((option) => option.value),
  custody: CUSTODY.map((option) => option.value),
  conflict: CONFLICT.map((option) => option.value),
  focus_now: FOCUS_AREAS.map((option) => option.value),
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Only known columns, only valid enum labels. Anything else is dropped rather
  // than passed to Postgres, which would reject it with an opaque error.
  const update: Record<string, string | null> = {};
  for (const [column, values] of Object.entries(ALLOWED)) {
    const value = body[column];
    if (value === null || value === undefined) {
      update[column] = null;
    } else if (typeof value === "string" && values.includes(value)) {
      update[column] = value;
    } else {
      return NextResponse.json({ message: `Unexpected value for ${column}.` }, { status: 400 });
    }
  }

  const { error } = await supabase
    .from("member_profiles")
    .update(update)
    .eq("user_id", user.id);

  if (error) {
    console.error("Profile save failed", error);
    return NextResponse.json({ message: "That did not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
