"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  initial: { holding_up: string; hardest: string; next_right: string };
  editing: boolean;
};

export default function CheckInForm({ initial, editing }: Props) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (error) setError("");
  }

  async function submit() {
    if (!values.holding_up.trim() && !values.hardest.trim() && !values.next_right.trim()) {
      setError("Write something in at least one box, even a few words.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "That did not save. Try again.");
      }
      router.replace("/member");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not save. Try again.");
      setSaving(false);
    }
  }

  return (
    <div className="checkin-form">
      <label className="checkin-field">
        <span>How are you holding up?</span>
        <textarea
          rows={3}
          value={values.holding_up}
          onChange={(event) => set("holding_up", event.target.value)}
        />
      </label>

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
