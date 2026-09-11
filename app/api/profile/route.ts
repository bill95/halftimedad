import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchProfile } from "@/lib/supabase-admin";
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

  // Patch, not replace. This used to write null for every column it was not
  // given, so changing one answer wiped the other three, and the "Update" link
  // on the member home was a wipe and re-collect rather than an edit.
  const update: Record<string, string | null> = {};
  for (const [column, values] of Object.entries(ALLOWED)) {
    if (!(column in body)) continue;
    const value = body[column];
    if (value === null) {
      update[column] = null;
    } else if (typeof value === "string" && values.includes(value)) {
      update[column] = value;
    } else {
      return NextResponse.json({ message: `Unexpected value for ${column}.` }, { status: 400 });
    }
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ message: "Nothing to change." }, { status: 400 });
  }

  try {
    await patchProfile(user.id, update);
  } catch (error) {
    console.error("Profile save failed", error);
    return NextResponse.json({ message: "That did not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
