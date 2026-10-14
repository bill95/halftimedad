import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import { trackServer } from "@/lib/analytics";
import { logScriptUsage } from "@/lib/supabase-admin";
import { FREE_MONTHLY_LIMIT, PAID_MONTHLY_LIMIT } from "@/lib/script/prompt";
import { parseRewriteInput, rewrite, type RewriteResult } from "@/lib/script/rewrite";

export const runtime = "nodejs";

/** The Script for signed-in accounts. Free: 3 a month. Members: 100 a month. */
export async function POST(request: Request) {
  const access = await getAccess();
  if (!access) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "That did not send. Try again." }, { status: 400 });
  }

  const input = parseRewriteInput(body);
  if ("error" in input) return NextResponse.json({ message: input.error }, { status: 400 });

  const supabase = await createClient();
  const isPaid = access.tier === "paid";

  // Calendar month, UTC. Both tiers count the same rows.
  const since = new Date();
  since.setUTCDate(1);
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("script_usage")
    .select("id", { count: "exact", head: true })
    .eq("user_id", access.userId)
    .gte("created_at", since.toISOString());
  const used = count ?? 0;

  if (isPaid && used >= PAID_MONTHLY_LIMIT) {
    return NextResponse.json(
      { message: "You have hit this month's limit. Reply to any Sunday Reset and I will lift it." },
      { status: 429 },
    );
  }
  if (!isPaid && used >= FREE_MONTHLY_LIMIT) {
    await trackServer("upgrade_viewed", { surface: "script_limit" });
    return NextResponse.json({ message: "upgrade_required" }, { status: 402 });
  }

  let result: RewriteResult;
  try {
    result = await rewrite(input, access.firstName);
  } catch (caught) {
    console.error("[script] rewrite failed", caught);
    return NextResponse.json({ message: "That did not go through. Try again in a moment." }, { status: 502 });
  }

  // The limits above count these rows. Members hold no INSERT grant on
  // script_usage, so this goes through the service role.
  try {
    await logScriptUsage({
      user_id: access.userId,
      channel: input.channel,
      outcome: input.outcome,
      input_chars: input.draft.length,
      output_chars: result.rewritten.length,
      was_paid: isPaid,
    });
  } catch (error) {
    console.error("[script] usage log failed", error);
  }

  await trackServer("script_used", { tier: isPaid ? "paid" : "free", channel: input.channel, outcome: input.outcome });

  const limit = isPaid ? PAID_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
  return NextResponse.json({ ...result, remaining: Math.max(0, limit - used - 1) });
}
