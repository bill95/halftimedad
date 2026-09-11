"use client";

import { useEffect, useState } from "react";

/**
 * The greeting has to come from the browser clock.
 *
 * It was computed on the server, and Vercel's servers run UTC, so at noon in
 * California the page said "Evening". It was wrong for essentially everyone
 * who was not in London.
 *
 * Renders the neutral form first so the server and client markup agree, then
 * corrects on mount.
 */
export default function Greeting({ firstName }: { firstName: string | null }) {
  const [part, setPart] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setPart(hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening");
  }, []);

  const name = firstName ? `, ${firstName}` : "";
  return <>{part ? `${part}${name}.` : `Hello${name}.`}</>;
}
