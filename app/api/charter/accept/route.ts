import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchProfile } from "@/lib/supabase-admin";
import { CHARTER_VERSION } from "@/content/charter";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in first." }, { status: 401 });
  }

  // Written as the service role. It used to be written with the member's own
  // key, which meant acceptance could be stamped through PostgREST without
  // ever loading the charter. A conduct agreement a member can sign on his own
  // behalf, silently, is not a record of anything.
  try {
    await patchProfile(user.id, {
      charter_accepted_at: new Date().toISOString(),
      charter_version: CHARTER_VERSION,
    });
  } catch (error) {
    console.error("Charter acceptance failed", error);
    return NextResponse.json({ message: "That did not save. Try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
