/**
 * The "not legal advice" line, in one place.
 *
 * Every free tool and every public answer page uses these. If counsel wants
 * the wording changed, change it here and it changes everywhere.
 *
 * Safe to import from client components: no secrets, no server-only code.
 */

/** One line, for under a tool or at the foot of a page. */
export const NOT_LEGAL_ADVICE_SHORT = "Education and peer perspective, not legal advice.";

/** The full notice, for answer pages and tool pages. */
export const NOT_LEGAL_ADVICE_FULL =
  "HalfTimeDad is not a law firm, and nothing here is legal advice. Using our tools or reading our pages does not create an attorney-client relationship. Family law is different in every state and every case. For custody, support, a court order, or anything with a deadline, talk to a licensed family law attorney where you live.";

/** Where we send a dad whose question is really a legal one. */
export const LEGAL_REFERRAL =
  "This one is a legal question, and it deserves a real answer from someone licensed where you live. Your state bar's lawyer referral service can connect you with a family law attorney, often for a low-cost first consult. A family mediator is another good option if you and your co-parent are both willing.";

/**
 * Prompt block shared by every model-backed free tool. The tool's own prompt
 * says what to do with `legal` in its output.
 */
export const LEGAL_BOUNDARY_PROMPT = `LEGAL BOUNDARY
You are not a lawyer and HalfTimeDad is not a law firm. Never give legal advice.
That means: never say what a court or judge will do or think, never interpret a custody order, parenting plan, or statute, never estimate child support or alimony, never advise on filing, modifying, relocating, or enforcing anything, and never say whether something is "allowed".
If the input asks a legal question or the right next step depends on the law, set "legal" to true. Still help with the human part you can help with, and never pretend the legal part is answered.
If the input has no legal question, set "legal" to false.`;
