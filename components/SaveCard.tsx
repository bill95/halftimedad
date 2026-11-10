"use client";

import { useState } from "react";
import { trackClient } from "@/components/Attribution";

/**
 * Email to free account, right where the value just landed. Shared by every
 * free tool that runs before sign-in. `surface` names the tool in analytics.
 */
export default function SaveCard({ heading, body, surface }: { heading: string; body: string; surface: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function send() {
    if (!email || state === "sending") return;
    setState("sending");
    trackClient("signup_started", { surface });
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
