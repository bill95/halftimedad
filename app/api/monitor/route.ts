import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Peace Monitor state for signed-in users.
 *
 * Anonymous visitors keep using localStorage exactly as before. The whole
 * point of a free account is that the count survives a browser, so the first
 * sign-in adopts whatever the browser was already holding rather than
 * resetting it. A man who has been counting for forty days must not lose
 * them by giving you his email address.
 */

export const dynamic = "force-dynamic";

type Body = {
  streakStartedAt?: number;
  longestStreak?: number;
  lifetimeResets?: number;
  totalCleanDays?: number;
};

function clampInt(value: unknown, max = 100_000) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

function clampStart(value: unknown) {
  const n = Number(value);
  const now = Date.now();
  // Not in the future, not before the product existed.
  if (!Number.isFinite(n) || n > now || n < Date.UTC(2025, 0, 1)) return now;
  return n;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ signedIn: false, state: null });

  const { data } = await supabase
    .from("monitor_state")
    .select("streak_started_at, longest_streak, lifetime_resets, total_clean_days")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return NextResponse.json({ signedIn: true, state: null });

  return NextResponse.json({
    signedIn: true,
    state: {
      streakStartedAt: Date.parse(data.streak_started_at),
      longestStreak: data.longest_streak,
      lifetimeResets: data.lifetime_resets,
      totalCleanDays: data.total_clean_days,
    },
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in first." }, { status: 401 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Bad request." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("monitor_state")
    .select("user_id, adopted_local_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = await supabase.from("monitor_state").upsert(
    {
      user_id: user.id,
      streak_started_at: new Date(clampStart(body.streakStartedAt)).toISOString(),
      longest_streak: clampInt(body.longestStreak),
      lifetime_resets: clampInt(body.lifetimeResets),
      total_clean_days: clampInt(body.totalCleanDays),
      // Stamped once, the first time a browser's count is carried onto an
      // account. Tells us later how many free signups came from the tracker.
      adopted_local_at: existing?.adopted_local_at ?? (existing ? null : new Date().toISOString()),
    },
    { onConflict: "user_id" }
  );

  if (error) return NextResponse.json({ message: "Could not save." }, { status: 500 });
  return NextResponse.json({ ok: true, adopted: !existing });
}
