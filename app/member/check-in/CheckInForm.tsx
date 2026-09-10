"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HOLDING_UP, type HoldingUp } from "@/content/check-in";

type Props = {
  initial: { holding_up: HoldingUp | null; hardest: string; next_right: string };
  editing: boolean;
};

export default function CheckInForm({ initial, editing }: Props) {
  const router = useRouter();
  const [holdingUp, setHoldingUp] = useState<HoldingUp | null>(initial.holding_up);
  const [values, setValues] = useState({
    hardest: initial.hardest,
    next_right: initial.next_right,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (error) setError("");
  }

  async function submit() {
    if (!holdingUp) {
      setError("Pick where the week landed. The rest is optional.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holding_up: holdingUp, ...values }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "That did not save. Try again.");
      }
      router.replace("/member?checked-in=1");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="checkin-form">
      <fieldset className="checkin-scale">
        <legend>How are you holding up?</legend>
        <div className="checkin-scale-options">
          {HOLDING_UP.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`checkin-scale-option${holdingUp === option.value ? " selected" : ""}`}
              aria-pressed={holdingUp === option.value}
              onClick={() => {
                setHoldingUp(option.value);
                if (error) setError("");
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="checkin-field">
        <span>What was hardest this week?</span>
        <textarea
          rows={3}
          value={values.hardest}
          onChange={(event) => set("hardest", event.target.value)}
        />
      </label>

      <label className="checkin-field">
        <span>What&rsquo;s the next right thing?</span>
        <textarea
          rows={3}
          value={values.next_right}
          onChange={(event) => set("next_right", event.target.value)}
        />
      </label>

      {error ? (
        <p className="charter-error" role="alert">
          {error}
        </p>
      ) : null}

      <button type="button" className="button button-primary" onClick={submit} disabled={saving}>
        {saving ? "Saving" : editing ? "Save changes" : "Done for this week"}
      </button>
    </div>
  );
}
