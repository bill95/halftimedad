"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CONFLICT,
  CUSTODY,
  FOCUS_AREAS,
  STAGES,
  type Conflict,
  type Custody,
  type FocusArea,
  type Option,
  type Stage,
} from "@/content/profile-options";

type Answers = {
  stage: Stage | null;
  custody: Custody | null;
  conflict: Conflict | null;
  focus_now: FocusArea | null;
};

const STEPS = [
  { key: "stage" as const, question: "Where are you in this?", options: STAGES },
  { key: "custody" as const, question: "How is time with the kids split?", options: CUSTODY },
  { key: "conflict" as const, question: "How are things with their mother?", options: CONFLICT },
  { key: "focus_now" as const, question: "What matters most right now?", options: FOCUS_AREAS },
];

type Props = {
  /** What is already on file. The wizard used to start from blank even when
   *  editing, so pulling the one lever a member has meant answering all four
   *  questions again and overwriting three good answers to change one. */
  initial: Answers;
  /** Single-question mode, used by "change your focus" on the member home. */
  only?: keyof Answers;
};

export default function ProfileForm({ initial, only }: Props) {
  const router = useRouter();
  const steps = only ? STEPS.filter((step) => step.key === only) : STEPS;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const current = steps[step];
  const isLast = step === steps.length - 1;

  async function save(final: Answers) {
    setSaving(true);
    setError("");
    try {
      // Send only what this form is responsible for. The route patches now,
      // so anything omitted is left alone rather than nulled.
      const payload = only
        ? { [only]: final[only] }
        : Object.fromEntries(steps.map((s) => [s.key, final[s.key]]));

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  function choose(value: string) {
    const next = { ...answers, [current.key]: value } as Answers;
    setAnswers(next);
    if (isLast) void save(next);
    else setStep(step + 1);
  }

  function skip() {
    if (isLast) void save(answers);
    else setStep(step + 1);
  }

  const currentValue = answers[current.key];

  return (
    <div className="profile-form">
      {steps.length > 1 ? (
        <p className="profile-progress">
          {step + 1} of {steps.length}
        </p>
      ) : null}
      <h2>{current.question}</h2>

      <div className="profile-options">
        {(current.options as Option<string>[]).map((option) => (
          <button
            key={option.value}
            type="button"
            className={`profile-option${currentValue === option.value ? " selected" : ""}`}
            aria-pressed={currentValue === option.value}
            onClick={() => choose(option.value)}
            disabled={saving}
          >
            <span className="profile-option-label">{option.label}</span>
            {option.hint ? <span className="profile-option-hint">{option.hint}</span> : null}
          </button>
        ))}
      </div>

      <div className="profile-actions">
        <button type="button" className="profile-skip" onClick={skip} disabled={saving}>
          {saving
            ? "Saving"
            : isLast
              ? currentValue
                ? "Leave it as it is"
                : "Finish without answering"
              : "Skip this one"}
        </button>
        {step > 0 && !saving ? (
          <button type="button" className="profile-skip" onClick={() => setStep(step - 1)}>
            Back
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="charter-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
