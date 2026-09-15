"use client";

import { useState } from "react";
import { CHANNELS, OUTCOMES, type Channel, type Outcome } from "@/lib/script/prompt";
import type { Tier } from "@/lib/access";

type Result = {
  rewritten: string;
  changes: string[];
  warning: string | null;
  blocked: boolean;
};

export default function ScriptForm({ tier }: { tier: Tier }) {
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState<Channel>("text");
  const [outcome, setOutcome] = useState<Outcome>("request");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function submit() {
    if (!draft.trim()) {
      setError("Paste the message you want to send.");
      return;
    }
    setWorking(true);
    setError("");
    setLocked(false);
    setResult(null);
    setCopied(false);

    try {
      const response = await fetch("/api/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, channel, outcome }),
      });
      const body = (await response.json().catch(() => ({}))) as Partial<Result> & {
        message?: string;
      };

      if (response.status === 402) {
        setLocked(true);
      } else if (!response.ok) {
        setError(body.message || "That did not go through. Try again in a moment.");
      } else {
        setResult(body as Result);
      }
    } catch {
      setError("That did not go through. Try again in a moment.");
    } finally {
      setWorking(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="checkin-form">
      <label className="checkin-field">
        <span>Your message</span>
        <textarea
          rows={7}
          value={draft}
          placeholder="Type it the way you want to say it. Nobody sees this but you."
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError("");
          }}
        />
      </label>

      <fieldset className="checkin-scale">
        <legend>Sending it by</legend>
        <div className="checkin-scale-options">
          {CHANNELS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`checkin-scale-option${channel === option.value ? " selected" : ""}`}
              aria-pressed={channel === option.value}
              onClick={() => setChannel(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="checkin-scale">
        <legend>What you need from it</legend>
        <div className="checkin-scale-options">
          {OUTCOMES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`checkin-scale-option${outcome === option.value ? " selected" : ""}`}
              aria-pressed={outcome === option.value}
              onClick={() => setOutcome(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p className="charter-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="button button-primary" onClick={submit} disabled={working}>
        {working ? "Working on it" : "Rewrite it"}
      </button>

      {tier === "free" && !result && !locked ? (
        <p className="script-footnote">Free accounts get one rewrite. Members get it every time.</p>
      ) : null}

      {locked ? (
        <div className="member-notice">
          <p>
            You have used your free rewrite. Members get the script every time they need it, along
            with the full library.
          </p>
          <p>
            <a className="member-tile-link" href="/#join">
              See what membership includes
            </a>
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="script-result">
          {result.warning ? (
            <blockquote className="script-warning">{result.warning}</blockquote>
          ) : null}

          {!result.blocked ? (
            <div className="script-output">
              <div className="member-card-head">
                <span>Send this instead</span>
                <button type="button" className="script-copy" onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="script-output-body">{result.rewritten}</p>
            </div>
          ) : null}

          {result.changes.length > 0 ? (
            <div className="script-changes">
              <div className="member-card-head">
                <span>What changed</span>
              </div>
              <ul>
                {result.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
