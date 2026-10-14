import { sendLetter } from "@/lib/email";

/**
 * A heads-up to the team inbox for every new signup:
 *   free       a new free account (first sign-in, auth/callback)
 *   paid       a founding membership paid (Stripe webhook)
 *   newsletter a new Sunday Reset subscriber (api/newsletter/subscribe)
 *
 * Goes to NOTIFY_EMAIL, default hello@halftimedad.co. Plain text, one line of
 * subject you can scan in a list. Never throws: a notification must not break
 * the signup it reports on.
 */

export type SignupKind = "free" | "paid" | "newsletter";

const SUBJECT: Record<SignupKind, string> = {
  free: "New free account",
  paid: "New founding member",
  newsletter: "New Sunday Reset subscriber",
};

export async function notifyNewSignup(opts: {
  kind: SignupKind;
  email: string;
  firstName?: string | null;
  /** Extra facts worth seeing at a glance, e.g. { "Founder #": "004", Plan: "annual" }. */
  details?: Record<string, string | number | null | undefined>;
}) {
  try {
    const to = process.env.NOTIFY_EMAIL || "hello@halftimedad.co";
    const who = opts.firstName ? `${opts.firstName} <${opts.email}>` : opts.email;
    const when = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles", dateStyle: "medium", timeStyle: "short" });
    const lines = [
      `${SUBJECT[opts.kind]}: ${who}`,
      "",
      `When: ${when} PT`,
      ...Object.entries(opts.details ?? {})
        .filter(([, value]) => value !== null && value !== undefined && value !== "")
        .map(([key, value]) => `${key}: ${value}`),
    ];
    const text = lines.join("\n");
    const html = `<pre style="font-family:Menlo,Consolas,monospace;font-size:14px;line-height:1.6">${text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</pre>`;
    await sendLetter(to, `${SUBJECT[opts.kind]}: ${opts.firstName || opts.email}`, html, text);
  } catch (error) {
    console.error(`Signup notification (${opts.kind}) failed`, error);
  }
}
