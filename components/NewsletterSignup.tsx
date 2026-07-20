"use client";

import { FormEvent, useState } from "react";

type Props = {
  variant?: "band" | "inline" | "footer";
};

export default function NewsletterSignup({ variant = "inline" }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(json.message || "Signup failed.");
      setStatus("success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className={`newsletter-success newsletter-success--${variant}`} role="status">
        <span>✓</span>
        <p>You&rsquo;re in. First issue arrives Sunday.</p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form className="newsletter-form newsletter-form--footer" onSubmit={submit}>
        <input name="email" type="email" placeholder="your@email.com" autoComplete="email" required aria-label="Email address" />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "…" : "Subscribe"}
        </button>
        {status === "error" && <p className="newsletter-error">{message}</p>}
      </form>
    );
  }

  if (variant === "band") {
    return (
      <form className="newsletter-form newsletter-form--band" onSubmit={submit}>
        <div className="newsletter-band-fields">
          <input name="firstName" type="text" placeholder="First name" autoComplete="given-name" aria-label="First name" />
          <input name="email" type="email" placeholder="your@email.com" autoComplete="email" required aria-label="Email address" />
          <button type="submit" className="button button-primary" disabled={status === "loading"}>
            {status === "loading" ? "Subscribing…" : "Get The Sunday Reset"}
          </button>
        </div>
        <p className="newsletter-note">Free. Every Sunday. Unsubscribe anytime.</p>
        {status === "error" && <p className="newsletter-error">{message}</p>}
      </form>
    );
  }

  // inline (default)
  return (
    <form className="newsletter-form newsletter-form--inline" onSubmit={submit}>
      <input name="firstName" type="text" placeholder="First name" autoComplete="given-name" aria-label="First name" />
      <input name="email" type="email" placeholder="your@email.com" autoComplete="email" required aria-label="Email address" />
      <button type="submit" className="button button-primary" disabled={status === "loading"}>
        {status === "loading" ? "Subscribing…" : "Get The Sunday Reset"}
      </button>
      {status === "error" && <p className="newsletter-error">{message}</p>}
    </form>
  );
}
