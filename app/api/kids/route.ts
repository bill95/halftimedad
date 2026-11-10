import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getAccess } from "@/lib/access";
import { trackServer } from "@/lib/analytics";
import { KIDS_DAILY_PER_VISITOR } from "@/lib/kids/options";
import { parseKidsInput, talk, type KidsResult } from "@/lib/kids/talk";
import { countToolTrials, logToolTrial } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * What to Tell the Kids. Open to everyone, signed in or not.
 *
 * Limits, checked before the model is called:
 *   - KIDS_DAILY_PER_VISITOR per visitor per 24 hours (visitor = HMAC of the
 *     IP, or of the user id when signed in; no IP stored). Members get 20.
 *   - KIDS_DAILY_CAP across everyone per 24 hours (default 200)
 * If the trials table cannot be read, this refuses rather than running
 * uncounted: an open endpoint must fail closed.
 */

const TOOL = "kids";
const DAY_MS = 24 * 60 * 60 * 1000;
const MEMBER_DAILY = 20;

function dailyCap() {
  const n = Number(process.env.KIDS_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? n : 200;
}

function visitorId(request: Request, userId: string | null) {
  const ip =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const secret = process.env.SCRIPT_TRIAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  return createHmac("sha256", secret).update(`${TOOL}:${key}`).digest("hex").slice(0, 32);
}

export async function POST(request: Request) {
  const access = await getAccess().catch(() => null);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "That did not send. Try again." }, { status: 400 });
  }

  const input = parseKidsInput(body);
  if ("error" in input) return NextResponse.json({ message: input.error }, { status: 400 });

  const visitor = visitorId(request, access?.userId ?? null);
  const since = new Date(Date.now() - DAY_MS).toISOString();
  const perVisitor = access?.tier === "paid" ? MEMBER_DAILY : KIDS_DAILY_PER_VISITOR;

  try {
    const [mine, everyone] = await Promise.all([countToolTrials(TOOL, since, visitor), countToolTrials(TOOL, since)]);
    if (mine >= perVisitor) {
      return NextResponse.json({ message: access ? "used_today_account" : "used_today" }, { status: 429 });
    }
    if (everyone >= dailyCap()) {
      console.error(`[kids] daily cap of ${dailyCap()} reached`);
      return NextResponse.json({ message: "busy" }, { status: 503 });
    }
  } catch (error) {
    console.error("[kids] limit check failed", error);
    return NextResponse.json({ message: "That did not go through. Try again in a moment." }, { status: 503 });
  }

  let result: KidsResult;
  try {
    result = await talk(input);
  } catch (caught) {
    console.error("[kids] talk failed", caught);
    return NextResponse.json({ message: "That did not go through. Try again in a moment." }, { status: 502 });
  }

  try {
    await logToolTrial({
      tool: TOOL,
      visitor,
      variant_a: input.situation,
      variant_b: input.age,
      input_chars: input.details.length,
      output_chars: result.say.length,
    });
  } catch (error) {
    console.error("[kids] trial log failed", error);
  }

  await trackServer("kids_used", {
    tier: access ? access.tier : "anonymous",
    situation: input.situation,
    age: input.age,
    legal: result.legal,
    blocked: result.blocked,
  });
  return NextResponse.json({ ...result, signedIn: Boolean(access) });
}
