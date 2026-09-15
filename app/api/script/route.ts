import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import {
  buildSystemPrompt,
  CHANNELS,
  OUTCOMES,
  FREE_LIFETIME_LIMIT,
  PAID_MONTHLY_LIMIT,
  type Channel,
  type Outcome,
} from "@/lib/script/prompt";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 4000;
const MODEL = "claude-sonnet-5";

export async function POST(request: Request) {
  const access = await getAccess();
  if (!access) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  let body: { draft?: string; channel?: string; outcome?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "That did not send. Try again." }, { status: 400 });
  }

  const draft = (body.draft ?? "").trim();
  const channel = body.channel as Channel;
  const outcome = body.outcome as Outcome;

  if (!draft) {
    return NextResponse.json({ message: "Paste the message you want to send." }, { status: 400 });
  }
  if (draft.length > MAX_INPUT_CHARS) {
    return NextResponse.json(
      { message: "That message is long enough that it needs cutting before it needs rewriting." },
      { status: 400 },
    );
  }
  if (!CHANNELS.some((c) => c.value === channel) || !OUTCOMES.some((o) => o.value === outcome)) {
    return NextResponse.json({ message: "That did not send. Try again." }, { status: 400 });
  }

  const supabase = await createClient();
  const isPaid = access.tier === "paid";

  if (isPaid) {
    const since = new Date();
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("script_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", access.userId)
      .gte("created_at", since.toISOString());

    if ((count ?? 0) >= PAID_MONTHLY_LIMIT) {
      return NextResponse.json(
        { message: "You have hit this month's limit. Reply to any Sunday Reset and I will lift it." },
        { status: 429 },
      );
    }
  } else {
    const { count } = await supabase
      .from("script_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", access.userId);

    if ((count ?? 0) >= FREE_LIFETIME_LIMIT) {
      return NextResponse.json({ message: "upgrade_required" }, { status: 402 });
    }
  }

  let parsed: {
    rewritten: string;
    changes: string[];
    warning: string | null;
    blocked: boolean;
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system: buildSystemPrompt(channel, outcome),
        messages: [{ role: "user", content: draft }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic returned ${response.status}`);

    const data = await response.json();
    const text = (data.content ?? [])
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    parsed = JSON.parse(text);
    if (typeof parsed.rewritten !== "string" || !Array.isArray(parsed.changes)) {
      throw new Error("Unexpected shape");
    }
  } catch (caught) {
    console.error("[script] rewrite failed", caught);
    return NextResponse.json(
      { message: "That did not go through. Try again in a moment." },
      { status: 502 },
    );
  }

  await supabase.from("script_usage").insert({
    user_id: access.userId,
    channel,
    outcome,
    input_chars: draft.length,
    output_chars: parsed.rewritten.length,
    was_paid: isPaid,
  });

  return NextResponse.json({
    rewritten: parsed.rewritten,
    changes: parsed.changes.slice(0, 4),
    warning: parsed.warning ?? null,
    blocked: Boolean(parsed.blocked),
  });
}
