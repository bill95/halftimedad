/**
 * The Script's options and limits. Safe to import from client components;
 * the system prompt lives in prompt.ts, which only server code imports.
 */
export const CHANNELS = [
  { value: "text", label: "Text message" },
  { value: "email", label: "Email" },
  { value: "app", label: "Co-parenting app" },
] as const;

export const OUTCOMES = [
  { value: "request", label: "Asking for a change" },
  { value: "respond", label: "Responding to an accusation" },
  { value: "confirm", label: "Confirming logistics" },
  { value: "decline", label: "Saying no" },
] as const;

export type Channel = (typeof CHANNELS)[number]["value"];
export type Outcome = (typeof OUTCOMES)[number]["value"];

// Free accounts: 3 rewrites per calendar month (UTC). Members: 100.
export const FREE_MONTHLY_LIMIT = 3;
export const PAID_MONTHLY_LIMIT = 100;

