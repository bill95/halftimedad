import { createHmac } from "node:crypto";

/**
 * Every account's personal share code, for links like halftimedad.co/?ref=<code>.
 *
 * Derived from the user id with a server secret, so it needs no table and
 * cannot be guessed or reversed. A visitor who arrives through it is recorded
 * as `ref:<code>` (components/Attribution.tsx) on every funnel event, and on
 * a founding reservation as referred_by. To find whose code it is, recompute
 * it for each account; that is fine at this size.
 */
export function shareCode(userId: string) {
  const secret = process.env.SCRIPT_TRIAL_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createHmac("sha256", secret).update(`share:${userId}`).digest("hex").slice(0, 10);
}

export function shareUrl(userId: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://halftimedad.co").replace(/\/$/, "");
  return `${site}/?ref=${shareCode(userId)}`;
}
