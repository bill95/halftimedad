import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Claiming and unclaiming a passage marker.
 *
 * RLS does the real enforcement: a member can only insert or delete rows for
 * himself, and only for badges flagged self_claim. Tenure badges written by
 * the Stripe webhook cannot be touched from here.
 */

export const dynamic = "force-dynamic";

async function claimable(slug: unknown) {
  return typeof slug === "string" && /^[a-z0-9_]{2,40}$/.test(slug) ? slug : null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { slug?: unknown; claimed?: unknown };
  const slug = await claimable(body.slug);
  if (!slug) return NextResponse.json({ message: "Unknown marker." }, { status: 400 });

  if (body.claimed === false) {
    const { error } = await supabase
      .from("member_badges")
      .delete()
      .eq("user_id", user.id)
      .eq("badge_slug", slug);
    if (error) return NextResponse.json({ message: "Could not undo that." }, { status: 400 });
    return NextResponse.json({ ok: true, claimed: false });
  }

  const { error } = await supabase
    .from("member_badges")
    .insert({ user_id: user.id, badge_slug: slug });
  // A second tap on something already claimed is not an error worth showing.
  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ message: "Could not save that." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, claimed: true });
}
