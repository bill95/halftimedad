"use client";

import { useState } from "react";

type ShareHalfTimeDadProps = {
  className?: string;
  label?: string;
};

const shareText = "No dad should have to navigate the hardest season of his life alone. HalfTimeDad offers practical tools and perspective for dads navigating divorce.";

export default function ShareHalfTimeDad({ className = "", label = "Share with a dad" }: ShareHalfTimeDadProps) {
  const [status, setStatus] = useState("");

  async function share() {
    const url = `${window.location.origin}/`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "HalfTimeDad", text: shareText, url });
        setStatus("Shared");
        return;
      }

      await navigator.clipboard.writeText(url);
      setStatus("Link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.location.href = `mailto:?subject=${encodeURIComponent("A resource for dads")}&body=${encodeURIComponent(`${shareText}\n\n${url}`)}`;
    }
  }

  return <div className="share-action"><button type="button" className={`button ${className}`.trim()} onClick={share}>{status || label}</button><span className="sr-only" aria-live="polite">{status}</span></div>;
}
