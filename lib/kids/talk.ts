import { buildKidsPrompt } from "@/lib/kids/prompt";
import {
  AGES,
  MAX_DETAILS_CHARS,
  MAX_PARENT_NAME_CHARS,
  SITUATIONS,
  type AgeBand,
  type Situation,
} from "@/lib/kids/options";

/**
 * What to Tell the Kids. Same shape as The Script (lib/script/rewrite.ts):
 * one prompt, one parser, one model. Details text is never stored.
 */

const MODEL = "claude-sonnet-5";

export type KidsInput = { situation: Situation; age: AgeBand; otherParent: string; details: string };
export type KidsResult = {
  say: string;
  avoid: string[];
  ifTheyAsk: { question: string; answer: string }[];
  note: string | null;
  warning: string | null;
  legal: boolean;
  blocked: boolean;
};

/** Validates a request body. Returns the input, or a message to show the user. */
export function parseKidsInput(body: unknown): KidsInput | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const situation = b.situation as Situation;
  const age = b.age as AgeBand;
  const details = typeof b.details === "string" ? b.details.trim() : "";
  const rawName = typeof b.otherParent === "string" ? b.otherParent.trim() : "";
  // A name the kids use, not an instruction. Letters, spaces, apostrophes, hyphens.
  const otherParent = rawName.replace(/[^\p{L}\p{M}' -]/gu, "").slice(0, MAX_PARENT_NAME_CHARS).trim() || "Mom";

  if (!SITUATIONS.some((s) => s.value === situation) || !AGES.some((a) => a.value === age)) {
    return { error: "Pick the moment and the kids' ages first." };
  }
  if (details.length > MAX_DETAILS_CHARS) {
    return { error: "That is a lot of detail. Cut it to the part the kids will actually notice." };
  }
  return { situation, age, otherParent, details };
}

function asStringList(value: unknown, max: number) {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim() !== "").slice(0, max) : [];
}

/** Calls the model and returns the parsed script. Throws on any failure. */
export async function talk(input: KidsInput): Promise<KidsResult> {
  const userMessage = input.details
    ? `What is going on, in his words:\n${input.details}`
    : "He did not add details. Write for the situation and ages as given.";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      system: buildKidsPrompt(input.situation, input.age, input.otherParent),
      messages: [{ role: "user", content: userMessage }],
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

  const parsed = JSON.parse(text) as Partial<KidsResult> & { ifTheyAsk?: unknown };
  if (typeof parsed.say !== "string") throw new Error("Unexpected shape");

  const ifTheyAsk = Array.isArray(parsed.ifTheyAsk)
    ? parsed.ifTheyAsk
        .filter(
          (item): item is { question: string; answer: string } =>
            !!item && typeof item.question === "string" && typeof item.answer === "string",
        )
        .slice(0, 3)
    : [];

  return {
    say: parsed.say,
    avoid: asStringList(parsed.avoid, 3),
    ifTheyAsk,
    note: typeof parsed.note === "string" ? parsed.note : null,
    warning: typeof parsed.warning === "string" ? parsed.warning : null,
    legal: Boolean(parsed.legal),
    blocked: Boolean(parsed.blocked),
  };
}
