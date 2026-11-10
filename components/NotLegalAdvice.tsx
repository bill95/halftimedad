import { LEGAL_REFERRAL, NOT_LEGAL_ADVICE_FULL, NOT_LEGAL_ADVICE_SHORT } from "@/lib/legal";

/**
 * The "not legal advice" notice.
 *   variant "line"     one sentence, under a tool
 *   variant "full"     the full notice, at the foot of a page or tool
 *   variant "referral" shown when a tool flags the question as legal
 */
export default function NotLegalAdvice({ variant = "line" }: { variant?: "line" | "full" | "referral" }) {
  if (variant === "referral") {
    return (
      <div className="legal-referral" role="note">
        <strong>That part is a legal question.</strong>
        <p>{LEGAL_REFERRAL}</p>
      </div>
    );
  }
  if (variant === "full") {
    return (
      <aside className="legal-notice" role="note" aria-label="Not legal advice">
        <strong>Not legal advice.</strong> {NOT_LEGAL_ADVICE_FULL}
      </aside>
    );
  }
  return <p className="script-footnote">{NOT_LEGAL_ADVICE_SHORT}</p>;
}
