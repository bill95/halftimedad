"use client";

import { useState } from "react";
import { trackClient } from "@/components/Attribution";
import NotLegalAdvice from "@/components/NotLegalAdvice";
import SaveCard from "@/components/SaveCard";
import {
  AGES,
  MAX_DETAILS_CHARS,
  MAX_PARENT_NAME_CHARS,
  SITUATIONS,
  type AgeBand,
  type Situation,
} from "@/lib/kids/options";

type Result = {
  say: string;
  avoid: string[];
  ifTheyAsk: { question: string; answer: string }[];
  note: string | null;
  warning: string | null;
  legal: boolean;
  blocked: boolean;
  signedIn?: boolean;
};

const SAVE_BODY =
  "A free account gets you The Script 3 times a month, the Peace Monitor, and one play a week. No password, no card.";

/** What to Tell the Kids. Result first, then the email ask, same as The Script. */
export default function KidsTalkForm() {
  const [situation, setSituation] = useState<Situation | null>(null);
  const [age, setAge] = useState<AgeBand | null>(null);
  const [otherParent, setOtherParent] = useState("Mom");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState<"none" | "anon" | "account">("none");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit() {
    if (!situation || !age) {
      setError("Pick the moment and the kids' ages first.");
      return;
    }
    setWorking(true);
    setError("");
    setLimit("none");
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ situation, age, otherParent, details }),
      });
      const body = (await response.json().catch(() => ({}))) as Partial<Result> & { message?: string };

      if (response.status === 429) setLimit(body.message === "used_today_account" ? "account" : "anon");
      else if (response.status === 503 && body.message === "busy") setError("This is busy right now. Try again in a little while.");
      else if (!response.ok) setError(body.message || "That did not go through. Try again in a moment.");
      else setResult(body as Result);
    } catch {
      setError("That did not go through. Try again in a moment.");
    } finally {
      setWorking(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.say);
    setCopied(true);
    trackClient("kids_copied");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="checkin-form script-form">
      <fieldset className="checkin-scale">
        <legend>What is happening</legend>
        <div className="checkin-scale-options">
          {SITUATIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`checkin-scale-option${situation === option.value ? " selected" : ""}`}
              aria-pressed={situation === option.value}
              onClick={() => {
                setSituation(option.value);
                if (error) setError("");
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="checkin-scale">
        <legend>How old are the kids</legend>
        <div className="checkin-scale-options">
          {AGES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`checkin-scale-option${age === option.value ? " selected" : ""}`}
              aria-pressed={age === option.value}
              onClick={() => {
                setAge(option.value);
                if (error) setError("");
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="script-footnote">Different ages? Pick the youngest. You can run it again for the older ones.</p>
      </fieldset>

      <label className="checkin-field">
        <span>What the kids call their other parent</span>
        <input
          type="text"
          value={otherParent}
          maxLength={MAX_PARENT_NAME_CHARS}
          onChange={(event) => setOtherParent(event.target.value)}
        />
      </label>

      <label className="checkin-field">
        <span>Anything they will notice (optional)</span>
        <textarea
          rows={4}
          value={details}
          maxLength={MAX_DETAILS_CHARS}
          placeholder="For example: I'm moving to an apartment ten minutes away and they'll be with me every other week. Nothing you type is saved."
          onChange={(event) => setDetails(event.target.value)}
        />
      </label>

      {error ? (
        <p className="charter-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="button button-primary" onClick={submit} disabled={working}>
        {working ? "Working on it" : "Give me the words"}
      </button>

      {limit === "anon" ? (
        <SaveCard surface="kids_try" heading="You have used today's free tries." body={`Come back tomorrow, or start free. ${SAVE_BODY}`} />
      ) : null}
      {limit === "account" ? (
        <div className="member-notice">
          <p>You have used today&rsquo;s tries. It resets in 24 hours.</p>
        </div>
      ) : null}

      {result ? (
        <div className="script-result">
          {result.warning ? <blockquote className="script-warning">{result.warning}</blockquote> : null}

          {!result.blocked && result.say ? (
            <div className="script-output">
              <div className="member-card-head">
                <span>What you can say</span>
                <button type="button" className="script-copy" onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="script-output-body">{result.say}</p>
            </div>
          ) : null}

          {result.note ? <p className="kids-note">{result.note}</p> : null}

          {result.ifTheyAsk.length > 0 ? (
            <div className="script-changes">
              <div className="member-card-head">
                <span>If they ask</span>
              </div>
              <ul>
                {result.ifTheyAsk.map((item, index) => (
                  <li key={index}>
                    <strong>&ldquo;{item.question}&rdquo;</strong>
                    <br />
                    {item.answer}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.avoid.length > 0 ? (
            <div className="script-changes">
              <div className="member-card-head">
                <span>Try not to say</span>
              </div>
              <ul>
                {result.avoid.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.legal ? <NotLegalAdvice variant="referral" /> : null}

          {!result.signedIn ? (
            <SaveCard surface="kids_try" heading="The next hard conversation is coming too." body={SAVE_BODY} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
