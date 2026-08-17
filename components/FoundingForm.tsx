"use client";

import { FormEvent, useState } from "react";
import { pricingFor, type Plan } from "@/content/pricing";

type Result = { founderNumber?: number; message?: string; referralCode?: string };

// Both tiers happen to save the same 17% on annual ($99 vs $119.88, $190 vs $228).
// Recheck this number if either price ever changes.
const ANNUAL_SAVINGS = "Save 17%";

const MONTHLY = pricingFor("monthly");
const ANNUAL = pricingFor("annual");

export default function FoundingForm() {
  const [plan, setPlan] = useState<Plan>("annual");
  const [status, setStatus] = useState<"idle" | "loading" | "checkout-error">("idle");
  const [result, setResult] = useState<Result>({});
  const [email, setEmail] = useState("");
  const [newsletter, setNewsletter] = useState(false);

  const selected = plan === "annual" ? ANNUAL : MONTHLY;

  async function openCheckout(details: { email: string; founderNumber: number; referralCode?: string }) {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...details, plan }),
    });
    const data = (await response.json()) as { url?: string; message?: string };
    if (!response.ok || !data.url) throw new Error(data.message || "Secure checkout could not be opened.");
    window.location.assign(data.url);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const submittedEmail = String(payload.email || "");
    setEmail(submittedEmail);
    try {
      const referral = new URLSearchParams(window.location.search).get("ref") || "";
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, plan, referral }),
      });
      const saved = (await response.json()) as Result;
      if (!response.ok || !saved.founderNumber) throw new Error(saved.message || "We could not reserve your founder number.");
      setResult(saved);
      // Newsletter opt-in — non-blocking, does not affect checkout
      if (newsletter && submittedEmail) {
        fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: submittedEmail, firstName: String(payload.firstName || "") }),
        }).catch(() => { /* silent — newsletter signup must never block checkout */ });
      }
      await openCheckout({ email: submittedEmail, founderNumber: saved.founderNumber, referralCode: saved.referralCode });
    } catch (error) {
      setResult((current) => ({ ...current, message: error instanceof Error ? error.message : "Something went wrong." }));
      setStatus("checkout-error");
    }
  }

  async function retryCheckout() {
    if (!result.founderNumber) return setStatus("idle");
    setStatus("loading");
    try {
      await openCheckout({ email, founderNumber: result.founderNumber, referralCode: result.referralCode });
    } catch (error) {
      setResult((current) => ({ ...current, message: error instanceof Error ? error.message : "Checkout is unavailable." }));
      setStatus("checkout-error");
    }
  }

  if (status === "checkout-error" && result.founderNumber) {
    return <div className="signup-card success-card" role="alert"><p className="kicker">Founder #{String(result.founderNumber).padStart(3, "0")} reserved</p><h3>Your place is safe.</h3><p>{result.message} You have not been charged.</p><button className="button button-primary submit-button" onClick={retryCheckout}>Try secure checkout again</button><button className="text-button" onClick={() => setStatus("idle")}>Return to the form</button></div>;
  }

  return <form className="signup-card" onSubmit={submit}>
    <div className="plan-toggle" aria-label="Choose a plan">
      <button type="button" className={plan === "monthly" ? "active" : ""} onClick={() => setPlan("monthly")} aria-pressed={plan === "monthly"}><span>Monthly</span><strong>{MONTHLY.display} <small>/ month</small></strong></button>
      <button type="button" className={plan === "annual" ? "active" : ""} onClick={() => setPlan("annual")} aria-pressed={plan === "annual"}><span>Annual · {ANNUAL_SAVINGS}</span><strong>{ANNUAL.display} <small>/ year</small></strong></button>
    </div>
    <p className="form-explainer">Membership begins today. After reserving your founder number, you’ll continue to Stripe’s secure checkout.</p>
    <div className="field-row"><label><span>First name</span><input name="firstName" autoComplete="given-name" required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" required /></label></div>
    <label><span>What would help most right now? <em>Optional</em></span><textarea name="challenge" rows={3} placeholder="A difficult message, parenting schedule, money, feeling less alone…" /></label>
    <label className="newsletter-checkbox-label"><input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} /><span>Also subscribe me to <strong>The Sunday Reset</strong> — a free weekly note from Bill.</span></label>
    <button className="button button-primary submit-button" disabled={status === "loading"}>{status === "loading" ? "Opening secure checkout…" : `Continue with the ${selected.display} ${plan} plan`}</button>
    <p className="privacy-note">Payments are securely processed by Stripe. Cancel anytime. We never sell your information.</p>
    {status === "checkout-error" && <p className="form-error" role="alert">{result.message} You have not been charged.</p>}
  </form>;
}
