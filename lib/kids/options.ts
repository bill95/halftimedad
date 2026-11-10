/**
 * What to Tell the Kids: options and limits. Safe to import from client
 * components; the system prompt lives in prompt.ts, server only.
 */
export const SITUATIONS = [
  { value: "moving_out", label: "One of us is moving out" },
  { value: "schedule", label: "A new schedule between two homes" },
  { value: "missed", label: "Their other parent missed a visit" },
  { value: "partner", label: "Introducing someone new" },
  { value: "heard", label: "They heard something about the divorce" },
  { value: "holiday", label: "A holiday or birthday apart" },
] as const;

export const AGES = [
  { value: "under5", label: "Under 5" },
  { value: "5to8", label: "5 to 8" },
  { value: "9to12", label: "9 to 12" },
  { value: "teen", label: "13 and up" },
] as const;

export type Situation = (typeof SITUATIONS)[number]["value"];
export type AgeBand = (typeof AGES)[number]["value"];

export const MAX_DETAILS_CHARS = 1500;
export const MAX_PARENT_NAME_CHARS = 24;

/** Tries per visitor per 24 hours, before sign-in or on a free account. */
export const KIDS_DAILY_PER_VISITOR = 2;
