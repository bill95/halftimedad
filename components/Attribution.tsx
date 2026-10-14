"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

const COOKIE = "htd_src";
const NINETY_DAYS = 60 * 60 * 24 * 90;

/**
 * First-touch attribution. On the first visit, records where this person came
 * from in a cookie the server reads when he signs up or pays:
 *   utm_source (+ utm_campaign)  e.g. "instagram/holiday-exchange"
 *   ?ref=<code>                  e.g. "ref:3f9a1c0d2b" (a member or creator code)
 *   referring site               e.g. "google.com"
 *   otherwise                    "direct"
 * Never overwritten, so the first door he walked through gets the credit.
 * Holds no personal data.
 */
function firstTouch(): string {
  const params = new URLSearchParams(window.location.search);
  const utm = params.get("utm_source");
  if (utm) {
    const campaign = params.get("utm_campaign");
    return campaign ? `${utm}/${campaign}` : utm;
  }
  const ref = params.get("ref");
  if (ref) return `ref:${ref}`;
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      if (host && !host.endsWith("halftimedad.co")) return host;
    }
  } catch {
    // Malformed referrer: fall through.
  }
  return "direct";
}

export function readSource(): string {
  const match = document.cookie.match(/(?:^|;\s*)htd_src=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "unknown";
}

export function trackClient(name: string, props: Record<string, string | number | boolean | null> = {}) {
  try {
    track(name, { ...props, source: readSource() });
  } catch {
    // Analytics never breaks the page.
  }
}

export default function Attribution() {
  const pathname = usePathname();
  useEffect(() => {
    if (/(?:^|;\s*)htd_src=/.test(document.cookie)) return;
    const value = encodeURIComponent(firstTouch().slice(0, 80));
    document.cookie = `${COOKIE}=${value}; Max-Age=${NINETY_DAYS}; Path=/; SameSite=Lax; Secure`;
  }, [pathname]);
  return null;
}

/** Drop into any server-rendered page to record one event when it is seen. */
export function TrackOnMount({ name, props }: { name: string; props?: Record<string, string | number | boolean | null> }) {
  useEffect(() => {
    trackClient(name, props);
    // Once per mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
