"use client";
import { useEffect, useState } from "react";

// /auth/callback sends people back here with ?error=… when a link fails.
const LINK_ERRORS: Record<string, string> = {
  link_expired: "That sign-in link expired or was already used. Links last an hour and work once. Send yourself a fresh one below.",
  missing_code: "That sign-in link was incomplete, which happens when an email app rewrites links. Send yourself a fresh one below.",
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromWelcome, setFromWelcome] = useState(false);

  // Read once on mount rather than with useSearchParams, so the page stays
  // static and needs no Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("email");
    const linkError = params.get("error");
    const timer = window.setTimeout(() => {
      if (prefill) setEmail(prefill);
      if (linkError) setError(LINK_ERRORS[linkError] ?? "That sign-in link did not work. Send yourself a fresh one below.");
      if (params.get("from") === "welcome") setFromWelcome(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function requestLink() {
    if (busy || !email) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setError(data.message ?? "That did not go through. Try again.");
        setBusy(false);
        return;
      }
      setSent(true);
    } catch {
      setError("That did not go through. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="founding-section">
      <div className="section-shell section">
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          {sent ? (
            <div className="signup-card success-card">
              <p className="kicker">Check your email</p>
              <h3>The link is on its way.</h3>
              <p>Check that inbox. The link works once and expires in an hour. Whatever your Peace Monitor has been counting in this browser comes with you.</p>
            </div>
          ) : (
            <div className="signup-card">
              <p className="kicker">{fromWelcome ? "Founding member" : "Sign in or start free"}</p>
              <h2 style={{ fontSize: 42, margin: "0 0 14px" }}>{fromWelcome ? "Open your dashboard" : "Sign in"}</h2>
              <p style={{ margin: "0 0 22px", color: "#c1cec5" }}>{fromWelcome
                ? "Use the email you paid with. We will send a one-tap link. No password, ever."
                : "No password. Enter your email and we will send a link. New here, that link makes your free account, and it keeps your count from dying with this browser."}</p>
              <label>
                <span>Email</span>
                <input type="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") requestLink(); }}
                  placeholder="you@example.com" />
              </label>
              {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
              <button type="button" onClick={requestLink} disabled={busy || !email}
                className="button button-primary submit-button">
                {busy ? "Sending" : "Send my sign-in link"}
              </button>
              {fromWelcome ? null : <p className="privacy-note" style={{ marginTop: 16 }}>Free gets you the Peace Monitor, a weekly play and a free rewrite from The Script. Membership opens the rest.</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
