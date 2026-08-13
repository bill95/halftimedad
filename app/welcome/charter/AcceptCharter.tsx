"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CHARTER_ACCEPT_LABEL } from "@/content/charter";

export default function AcceptCharter() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/charter/accept", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message || "That did not save. Try again.");
      }
      router.replace("/member");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That did not save. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="charter-actions">
      <button
        type="button"
        className="button button-primary"
        onClick={accept}
        disabled={pending}
      >
        {pending ? "One moment" : CHARTER_ACCEPT_LABEL}
      </button>
      {error ? (
        <p className="charter-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
