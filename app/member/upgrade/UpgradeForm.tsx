"use client";

import { useEffect, useState } from "react";
import { pricingFor, type Plan } from "@/content/pricing";
import { trackClient } from "@/components/Attribution";

const MONTHLY = pricingFor("monthly");
const ANNUAL = pricingFor("annual");

export default function UpgradeForm({ firstName: initialName }: { firstName: string }) {
  const [plan, setPlan] = useState<Plan>("annual");
  const [firstName, setFirstName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackClient("upgrade_viewed", { surface: "in_app" });
  }, []);

  async function go() {
    if (busy) return;
    setBusy(true);
    setError("");
    trackClient("checkout_started", { plan, surface: "in_app" });
    try {
      const response = await fetch("/api/stripe/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, firstName }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; message?: string };
      if (!response.ok || !data.url) throw new Error(data.message || "Secure checkout could not be opened.");
      window.location.assign(data.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="signup-card upgrade-card">
      <div className="plan-toggle" aria-label="Choose a plan">
        <button type="button" className={plan === "monthly" ? "active" : ""} onClick={() => setPlan("monthly")} aria-pressed={plan === "monthly"}>
          <span>Monthly</span>
          <strong>
            {MONTHLY.display} <small>/ month</small>
          </strong>
        </button>
        <button type="button" className={plan === "annual" ? "active" : ""} onClick={() => setPlan("annual")} aria-pressed={plan === "annual"}>
          <span>Annual · Save 17%</span>
          <strong>
            {ANNUAL.display} <small>/ year</small>
          </strong>
        </button>
      </div>
      <label>
        <span>First name, for your founder record</span>
        <input value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" />
      </label>
      <button type="button" className="button button-primary submit-button" onClick={go} disabled={busy || !firstName.trim()}>
        {busy ? "Opening secure checkout…" : `Continue with ${plan === "annual" ? ANNUAL.display + " a year" : MONTHLY.display + " a month"}`}
      </button>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="privacy-note">
        Payments are processed by Stripe. Founding price locked while you stay. Cancel anytime. Your founder number is issued
        when payment goes through.
      </p>
    </div>
  );
}
