import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Account deletion.
 *
 * Deleting the auth user cascades to member_profiles, check_ins,
 * member_badges, monitor_state and nudge_sends. The founding_members row is
 * deliberately kept and unlinked: it is a payment record, Stripe still has
 * the subscription, and destroying it would leave money moving with nothing
 * to explain it. The founder number is not reissued.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ message: "Not available." }, { status: 503 });
  const base = url.replace(/\/$/, "");
  const headers = { apikey: key, Authorization: `Bearer ${key}` };

  // Unlink the payment record first so the cascade cannot orphan it.
  const unlink = await fetch(`${base}/rest/v1/founding_members?user_id=eq.${user.id}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ user_id: null }),
    cache: "no-store",
  });
  if (!unlink.ok) {
    console.error("Delete: unlink failed", await unlink.text());
    return NextResponse.json({ message: "Could not delete." }, { status: 500 });
  }

  const removed = await fetch(`${base}/auth/v1/admin/users/${user.id}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });
  if (!removed.ok) {
    console.error("Delete: auth user removal failed", await removed.text());
    return NextResponse.json({ message: "Could not delete." }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
