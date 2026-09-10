"use client";

import { useState } from "react";

type Props = {
  email: string;
  tier: "free" | "paid";
  weeklyNudge: boolean;
  billingUrl: string;
};

export default function SettingsPanel({ email, tier, weeklyNudge, billingUrl }: Props) {
  const [nudge, setNudge] = useState(weeklyNudge);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function toggleNudge() {
    setBusy(true);
    const next = !nudge;
    setNudge(next);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekly_nudge: next }),
      });
      if (!res.ok) throw new Error();
      setStatus(next ? "Sunday note back on." : "Sunday note off.");
    } catch {
      setNudge(!next);
      setStatus("That did not save.");
    } finally {
      setBusy(false);
    }
  }

  async function exportData() {
    setStatus("Building your file");
    try {
      const res = await fetch("/api/settings/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "halftimedad-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded.");
    } catch {
      setStatus("Could not build that file.");
    }
  }

  async function deleteEverything() {
    if (confirm !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/delete", { method: "POST" });
      if (!res.ok) throw new Error();
      window.location.href = "/?deleted=1";
    } catch {
      setStatus("That did not go through. Email hello@halftimedad.co.");
      setDeleting(false);
    }
  }

  return (
    <>
      <section className="member-card">
        <div className="member-card-head">
          <span>Account</span>
          <span>{tier === "paid" ? "Member" : "Free"}</span>
        </div>
        <p className="member-card-body">
          Signed in as {email}. To change the address on the account, email hello@halftimedad.co and
          a person will move it.
        </p>
        {tier === "paid" ? (
          <a
            className="button button-secondary"
            href={billingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Manage membership and billing
          </a>
        ) : (
          <a className="button button-primary" href="/#join">
            See what membership costs
          </a>
        )}
      </section>

      <section className="member-card">
        <div className="member-card-head">
          <span>The Sunday note</span>
          <span>{nudge ? "On" : "Off"}</span>
        </div>
        <p className="member-card-body">
          One short email on Sunday when you have not checked in, with whatever you said you would
          do last time. Nothing else.
        </p>
        <button
          type="button"
          className="button button-secondary"
          onClick={toggleNudge}
          disabled={busy}
        >
          {nudge ? "Turn it off" : "Turn it back on"}
        </button>
      </section>

      <section className="member-card">
        <div className="member-card-head">
          <span>Your data</span>
          <span>Yours</span>
        </div>
        <p className="member-card-body">
          Every check-in, every marker, your profile and your Peace Monitor count, in one file. Some
          men here have good reasons to know exactly what exists in writing.
        </p>
        <button type="button" className="button button-secondary" onClick={exportData}>
          Download everything
        </button>
      </section>

      <section className="member-card member-locked">
        <div className="member-card-head">
          <span>Delete your account</span>
          <span>Permanent</span>
        </div>
        <p className="member-card-body">
          This erases your check-ins, markers, profile and count, and cannot be undone. If you have
          an active membership, cancel the billing first, or it keeps charging.
        </p>
        <label className="checkin-field">
          <span>Type DELETE to confirm</span>
          <input
            value={confirm}
            onChange={(event) => setConfirm(event.target.value.toUpperCase())}
            style={{ width: "100%", padding: "0.7rem 0.8rem", borderRadius: 10, border: "1px solid rgba(23,35,29,0.2)" }}
          />
        </label>
        <button
          type="button"
          className="button button-secondary"
          onClick={deleteEverything}
          disabled={confirm !== "DELETE" || deleting}
        >
          {deleting ? "Deleting" : "Delete everything"}
        </button>
      </section>

      {status ? (
        <p className="passage-note" role="status">
          {status}
        </p>
      ) : null}
    </>
  );
}
