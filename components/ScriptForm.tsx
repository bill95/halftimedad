"use client";

import { useState } from "react";
import Link from "next/link";
import { CHANNELS, OUTCOMES, FREE_MONTHLY_LIMIT, type Channel, type Outcome } from "@/lib/script/options";
import { trackClient } from "@/components/Attribution";

/**
 * The homepage example: a draft a dad might be about to send, and the kind of
 * rewrite The Script gives back. Illustrative, written by us, not a real
 * member's message. Keeps the other parent unnamed and nobody the villain.
 */
const EXAMPLE = {
  before:
    "40 minutes late AGAIN. The kids sat by the door with their coats on the whole time. If you can't respect the schedule maybe we need to have lawyers sort it out.",
  after:
    "The kids were ready at 5:00 and pickup was at 5:40. Can we either keep 5:00, or text by 4:30 if you're running behind? That way they're not waiting by the door.",
};

type Result = {
  rewritten: string;
  changes: string[];
  warning: string | null;
  blocked: boolean;
  remaining?: number;
};

/**
 * The Script form, in two places:
 *   mode "try"    the homepage, before sign-in. One free try a day, then an
 *                 email turns into a free account (3 a month).
 *   mode "member" /member/script, signed in. Free 3 a month, members 100.
 */
export default function ScriptForm({ mode, tier = "free" }: { mode: "try" | "member"; tier?: "free" | "paid" }) {
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState<Channel>("text");
  const [outcome, setOutcome] = useState<Outcome>("request");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [limit, setLimit] = useState<"none" | "try" | "free">("none");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);

  async function post(url: string) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft, channel, outcome }),
    });
    const body = (await response.json().catch(() => ({}))) as Partial<Result> & { message?: string; useMember?: boolean };
    return { response, body };
  }

  async function submit() {
    if (!draft.trim()) {
      setError("Paste the message you want to send.");
      return;
    }
    setWorking(true);
    setError("");
    setLimit("none");
    setResult(null);
    setCopied(false);

    try {
      let { response, body } = await post(mode === "try" ? "/api/script/try" : "/api/script");
      // Signed in after all: his own allowance applies.
      if (response.status === 409 && body.useMember) ({ response, body } = await post("/api/script"));

      if (response.status === 402) setLimit("free");
      else if (response.status === 429 && body.message === "used_free_try") setLimit("try");
      else if (response.status === 503 && body.message === "busy") setError("The Script is busy right now. Make a free account below and it will be there for you.");
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
    await navigator.clipboard.writeText(result.rewritten);
    setCopied(true);
    trackClient("script_copied", { mode });
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="checkin-form script-form">
      {mode === "try" && !result && !draft ? (
        <div className="script-example">
          <div className="script-example-pair">
            <p className="script-example-before">
              <span>Before</span>
              {EXAMPLE.before}
            </p>
            <p className="script-example-after">
              <span>After The Script</span>
              {EXAMPLE.after}
            </p>
          </div>
          <button
            type="button"
            className="script-example-try"
            onClick={() => {
              setDraft(EXAMPLE.before);
              setOutcome("request");
              trackClient("script_example_loaded", { mode });
            }}
          >
            Try it with this example →
          </button>
        </div>
      ) : null}

      <label className="checkin-field">
        <span>{mode === "try" ? "The message you got, or the one you are about to send" : "Your message"}</span>
        <textarea
          rows={mode === "try" ? 5 : 7}
          value={draft}
          placeholder="Type it the way you want to say it. Nobody sees this but you, and it is not saved."
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

      {mode === "member" && tier === "free" && !result && limit === "none" ? (
        <p className="script-footnote">Free accounts get {FREE_MONTHLY_LIMIT} rewrites a month. Members get it every time.</p>
      ) : null}

      {limit === "free" ? (
        <div className="member-notice">
          <p>
            You have used this month&rsquo;s {FREE_MONTHLY_LIMIT} free rewrites. Members get The Script every time they
            need it, along with the full library and the weekly check-in.
          </p>
          <p>
            <Link className="member-tile-link" href="/member/upgrade">
              See founding membership
            </Link>
          </p>
        </div>
      ) : null}

      {limit === "try" ? (
        <SaveCard
          heading="You have used today's free try."
          body={`A free account gets you ${FREE_MONTHLY_LIMIT} rewrites a month, the Peace Monitor, and one play a week. No password, no card.`}
        />
      ) : null}

      {result ? (
        <div className="script-result">
          {result.warning ? <blockquote className="script-warning">{result.warning}</blockquote> : null}

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

          {mode === "member" && tier === "free" && typeof result.remaining === "number" ? (
            <p className="script-footnote">
              {result.remaining === 0
                ? "That was your last free rewrite this month."
                : `${result.remaining} free ${result.remaining === 1 ? "rewrite" : "rewrites"} left this month.`}
            </p>
          ) : null}

          {mode === "try" ? (
            <SaveCard
              heading="The next one is waiting for you too."
              body={`Make a free account and you get ${FREE_MONTHLY_LIMIT} rewrites a month, the Peace Monitor, and one play a week. No password, no card.`}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Email to free account, right where the value just landed. */
function SaveCard({ heading, body }: { heading: string; body: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    if (!email || state === "sending") return;
    setState("sending");
    trackClient("signup_started", { surface: "script_try" });
    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) {
        setMessage(data.message ?? "That did not go through. Try again.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setMessage("That did not go through. Try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="script-save success">
        <strong>Check your email.</strong>
        <p>The link makes your free account and signs you in. It works once and lasts an hour.</p>
      </div>
    );
  }

  return (
    <div className="script-save">
      <strong>{heading}</strong>
      <p>{body}</p>
      <div className="script-save-row">
        <input
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-label="Email address"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
        />
        <button type="button" className="button button-primary" onClick={send} disabled={!email || state === "sending"}>
          {state === "sending" ? "Sending" : "Start free"}
        </button>
      </div>
      {state === "error" ? (
        <p className="charter-error" role="alert">
          {message}
        </p>
      ) : null}
    </div>
  );
}
