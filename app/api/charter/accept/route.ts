import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CHARTER_VERSION } from "@/content/charter";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  }

  // Written as the member, not the service role, so RLS is the thing enforcing
  // that a member can only ever accept on their own behalf.
  const { error } = await supabase.from("member_profiles").upsert(
    {
      user_id: user.id,
      charter_accepted_at: new Date().toISOString(),
      charter_version: CHARTER_VERSION,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Charter acceptance failed", error);
    return NextResponse.json({ message: "That did not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
