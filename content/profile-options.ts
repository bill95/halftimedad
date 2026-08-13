/**
 * Labels for the member_profiles enums.
 *
 * Values must match the Postgres enum labels exactly. Prose lives here rather
 * than in components so the wording can be edited without touching JSX, and so
 * the same label is used everywhere a value is displayed.
 */

export type Option<T extends string> = { value: T; label: string; hint?: string };

export type Stage = "considering" | "filing" | "in_process" | "first_year" | "established";
export type Custody =
  | "fifty_fifty"
  | "primary"
  | "eow"
  | "supervised"
  | "no_contact"
  | "undetermined";
export type Conflict = "low" | "managed" | "high";
export type FocusArea =
  | "stability"
  | "coparent_comms"
  | "kids_wellbeing"
  | "money_legal"
  | "body"
  | "head"
  | "rebuilding"
  | "dating";

export const STAGES: Option<Stage>[] = [
  { value: "considering", label: "Still deciding", hint: "Nothing filed yet" },
  { value: "filing", label: "Filing now" },
  { value: "in_process", label: "In the middle of it", hint: "Lawyers, hearings, negotiation" },
  { value: "first_year", label: "First year out", hint: "It's done on paper" },
  { value: "established", label: "Further along" },
];

export const CUSTODY: Option<Custody>[] = [
  { value: "fifty_fifty", label: "Roughly 50/50" },
  { value: "primary", label: "They're with me most of the time" },
  { value: "eow", label: "Every other weekend" },
  { value: "supervised", label: "Supervised" },
  { value: "no_contact", label: "No contact right now" },
  { value: "undetermined", label: "Not settled yet" },
];

export const CONFLICT: Option<Conflict>[] = [
  { value: "low", label: "Mostly calm", hint: "We can talk" },
  { value: "managed", label: "Manageable with effort", hint: "It works if I'm careful" },
  { value: "high", label: "Hard", hint: "Most exchanges cost me something" },
];

export const FOCUS_AREAS: Option<FocusArea>[] = [
  { value: "stability", label: "Getting steady" },
  { value: "coparent_comms", label: "Talking to their mother" },
  { value: "kids_wellbeing", label: "How the kids are doing" },
  { value: "money_legal", label: "Money and legal" },
  { value: "body", label: "Sleep, food, moving" },
  { value: "head", label: "My own head" },
  { value: "rebuilding", label: "Rebuilding a life" },
  { value: "dating", label: "Dating again" },
];

export function labelFor<T extends string>(options: Option<T>[], value: T | null | undefined) {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? null;
}
