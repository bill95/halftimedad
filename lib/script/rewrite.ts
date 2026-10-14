import { buildSystemPrompt, CHANNELS, OUTCOMES, type Channel, type Outcome } from "@/lib/script/prompt";

/**
 * The Script's rewrite, shared by the member route (/api/script) and the
 * homepage try-it route (/api/script/try). One prompt, one parser, one model.
 * Message text is never stored by either caller.
 */

export const MAX_INPUT_CHARS = 4000;
const MODEL = "claude-sonnet-5";

export type RewriteInput = { draft: string; channel: Channel; outcome: Outcome };
export type RewriteResult = { rewritten: string; changes: string[]; warning: string | null; blocked: boolean };

/** Validates a request body. Returns the input, or a message to show the user. */
export function parseRewriteInput(body: unknown): RewriteInput | { error: string } {
  const b = (body ?? {}) as { draft?: unknown; channel?: unknown; outcome?: unknown };
  const draft = typeof b.draft === "string" ? b.draft.trim() : "";
  const channel = b.channel as Channel;
  const outcome = b.outcome as Outcome;

  if (!draft) return { error: "Paste the message you want to send." };
  if (draft.length > MAX_INPUT_CHARS) return { error: "That message is long enough that it needs cutting before it needs rewriting." };
  if (!CHANNELS.some((c) => c.value === channel) || !OUTCOMES.some((o) => o.value === outcome)) {
    return { error: "That did not send. Try again." };
  }
  return { draft, channel, outcome };
}

/** Calls the model and returns the parsed rewrite. Throws on any failure. */
export async function rewrite(input: RewriteInput, firstName: string | null): Promise<RewriteResult> {
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
      system: buildSystemPrompt(input.channel, input.outcome, firstName),
      messages: [{ role: "user", content: input.draft }],
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

  const parsed = JSON.parse(text) as RewriteResult;
  if (typeof parsed.rewritten !== "string" || !Array.isArray(parsed.changes)) throw new Error("Unexpected shape");

  return {
    rewritten: parsed.rewritten,
    changes: parsed.changes.slice(0, 4),
    warning: parsed.warning ?? null,
    blocked: Boolean(parsed.blocked),
  };
}
