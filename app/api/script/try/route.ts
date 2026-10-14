import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getAccess } from "@/lib/access";
import { trackServer } from "@/lib/analytics";
import { parseRewriteInput, rewrite } from "@/lib/script/rewrite";
import { countScriptTrials, logScriptTrial } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * The Script on the homepage, before sign-in. The point is to prove value in
 * thirty seconds: paste, get the calm version, then we ask for an email.
 *
 * Limits, both checked before the model is called:
 *   - one try per visitor per 24 hours (visitor = HMAC of the IP; no IP stored)
 *   - SCRIPT_TRIAL_DAILY_CAP tries across everyone per 24 hours (default 300)
 * If the trials table cannot be read, this refuses rather than running
 * uncounted: an open endpoint must fail closed.
 *
 * A signed-in visitor is sent to the member route instead, where his own
 * monthly allowance applies.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function dailyCap() {
  const n = Number(process.env.SCRIPT_TRIAL_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? n : 300;
}

function visitorId(request: Request) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const secret = process.env.SCRIPT_TRIAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHmac("sha256", secret).update(`script-trial:${ip}`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  if (await getAccess().catch(() => null)) {
    return NextResponse.json({ useMember: true }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "That did not send. Try again." }, { status: 400 });
  }

  const input = parseRewriteInput(body);
  if ("error" in input) return NextResponse.json({ message: input.error }, { status: 400 });

  const visitor = visitorId(request);
  const since = new Date(Date.now() - DAY_MS).toISOString();

  try {
    const [mine, everyone] = await Promise.all([countScriptTrials(since, visitor), countScriptTrials(since)]);
    if (mine >= 1) {
      await trackServer("upgrade_viewed", { surface: "script_try_limit" });
      return NextResponse.json({ message: "used_free_try" }, { status: 429 });
    }
    if (everyone >= dailyCap()) {
      console.error(`[script/try] daily cap of ${dailyCap()} reached`);
      return NextResponse.json({ message: "busy" }, { status: 503 });
    }
  } catch (error) {
    console.error("[script/try] limit check failed", error);
    return NextResponse.json({ message: "That did not go through. Try again in a moment." }, { status: 503 });
  }

  let result;
  try {
    result = await rewrite(input, null);
  } catch (caught) {
    console.error("[script/try] rewrite failed", caught);
    return NextResponse.json({ message: "That did not go through. Try again in a moment." }, { status: 502 });
  }

  try {
    await logScriptTrial({
      visitor,
      channel: input.channel,
      outcome: input.outcome,
      input_chars: input.draft.length,
      output_chars: result.rewritten.length,
    });
  } catch (error) {
    console.error("[script/try] trial log failed", error);
  }

  await trackServer("script_used", { tier: "anonymous", channel: input.channel, outcome: input.outcome });
  return NextResponse.json(result);
}
