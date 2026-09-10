"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="section-shell legal-page">
      <p className="kicker">Something broke</p>
      <h1>That did not load.</h1>
      <p>
        This one is on us, not on you. Try again, and if it keeps happening, email
        hello@halftimedad.co and it gets looked at by a person.
      </p>
      <div className="member-actions" style={{ marginTop: "1.5rem" }}>
        <button type="button" className="button button-primary" onClick={reset}>
          Try again
        </button>
        <Link className="member-tile-link" href="/member">
          Back to your room
        </Link>
      </div>
    </main>
  );
}
