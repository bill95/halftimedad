"use client";

import { useState } from "react";

/**
 * Shown once, on a man's first look at the member home.
 *
 * There was nothing here telling him what this place is or what to do first,
 * so the page read as a dashboard for a product he had not been introduced
 * to. Dismissal is local to the browser on purpose: this is orientation, not
 * a preference worth a column and a round trip.
 */
const KEY = "htd-first-run-dismissed";

export default function FirstRun({ tier }: { tier: "free" | "paid" }) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return window.localStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  function close() {
    setDismissed(true);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Private browsing. It reappears next time, which is survivable.
    }
  }

  return (
    <section className="first-run">
      <div className="first-run-top">
        <p className="first-run-lede-head">New here</p>
        <button type="button" className="first-run-close" onClick={close}>
          Got it
        </button>
      </div>
      <p className="first-run-lede">
        This is not a course and there is nothing to catch up on. Three things live here.
      </p>
      <ol className="first-run-list">
        <li>
          <strong>The play.</strong> One thing to work on this week, picked from what you just told
          us. It changes when your focus changes.
        </li>
        {tier === "paid" ? (
          <li>
            <strong>The check-in.</strong> Three questions on your own schedule. Nobody else reads
            them. It is the part that compounds.
          </li>
        ) : (
          <li>
            <strong>The count.</strong> The Peace Monitor, now saved to your account instead of to
            one browser.
          </li>
        )}
        <li>
          <strong>The library.</strong> Written for where you actually are, not a list of
          everything.
        </li>
      </ol>
    </section>
  );
}
