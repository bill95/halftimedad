import { cookies } from "next/headers";
import { track } from "@vercel/analytics/server";

/**
 * Funnel events, server side. Vercel Web Analytics custom events.
 *
 * The six events the roadmap tracks:
 *   account_created  auth/callback, first sign-in       (server)
 *   script_used      api/script, after a rewrite       (server)
 *   monitor_started  Peace Monitor, own count created  (client)
 *   play_read        library article opened            (client)
 *   upgrade_viewed   locked page or founding form seen (client)
 *   paid             Stripe webhook, membership paid   (server)
 * plus checkout_started when the founding form submits (client).
 *
 * Every event carries `source`: the first-touch attribution cookie set by
 * components/Attribution.tsx (utm_source, ?ref= code, or referring site).
 * Analytics must never break a request, so failures are swallowed.
 */

export const SOURCE_COOKIE = "htd_src";

export async function firstTouchSource(): Promise<string> {
  try {
    const value = (await cookies()).get(SOURCE_COOKIE)?.value;
    return value ? decodeURIComponent(value).slice(0, 80) : "unknown";
  } catch {
    return "unknown";
  }
}

export async function trackServer(name: string, props: Record<string, string | number | boolean | null> = {}) {
  try {
    const source = props.source ?? (await firstTouchSource());
    await track(name, { ...props, source });
  } catch (error) {
    console.error(`Analytics event ${name} failed`, error);
  }
}
