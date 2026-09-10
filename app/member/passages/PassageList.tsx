"use client";

import { useState } from "react";

type Passage = {
  slug: string;
  label: string;
  description: string | null;
  claimed: boolean;
};

export default function PassageList({ initial }: { initial: Passage[] }) {
  const [passages, setPassages] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function toggle(slug: string, claimed: boolean) {
    setBusy(slug);
    // Optimistic: the tap should feel like a tap, not like a form.
    setPassages((rows) =>
      rows.map((row) => (row.slug === slug ? { ...row, claimed: !claimed } : row))
    );
    try {
      const res = await fetch("/api/passages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, claimed: !claimed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPassages((rows) =>
        rows.map((row) => (row.slug === slug ? { ...row, claimed } : row))
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="passage-list">
      {passages.map((passage) => (
        <li key={passage.slug} className={`passage${passage.claimed ? " claimed" : ""}`}>
          <button
            type="button"
            aria-pressed={passage.claimed}
            disabled={busy === passage.slug}
            onClick={() => toggle(passage.slug, passage.claimed)}
          >
            <span className="passage-mark" aria-hidden="true" />
            <span className="passage-copy">
              <strong>{passage.label}</strong>
              {passage.description ? <span>{passage.description}</span> : null}
            </span>
            <span className="passage-state">{passage.claimed ? "Been through it" : "Mark it"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
