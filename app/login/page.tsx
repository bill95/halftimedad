"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              <p>If that address is on the founding list, a sign-in link is in your inbox. It works once and expires in an hour.</p>
            </div>
          ) : (
            <div className="signup-card">
              <p className="kicker">Founding members</p>
              <h2 style={{ fontSize: 42, margin: "0 0 14px" }}>Sign in</h2>
              <p style={{ margin: "0 0 22px", color: "#c1cec5" }}>No password. Enter your email and we will send a link that signs you in.</p>
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
              <p className="privacy-note" style={{ marginTop: 16 }}>Membership opens September 1.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
