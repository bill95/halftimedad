import { NextResponse } from "next/server";
import { weekOf } from "@/lib/member";
import { nudgeHtml, nudgeSubject, nudgeText } from "@/content/emails/sunday-nudge";

/**
 * Sunday nudge job.
 *
 * Runs from a Vercel cron. Sends to paid members who have not checked in this
 * week and have not already been mailed for it. Idempotent by primary key on
 * nudge_sends rather than by the job remembering: a cron that retries must
 * never mail a man twice.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Candidate = {
  user_id: string;
  email: string;
  first_name: string | null;
  nudge_token: string;
  last_next_right: string | null;
};

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin environment is not configured");
  return {
    base: url.replace(/\/$/, ""),
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  };
}

async function rpc(path: string, init: RequestInit = {}) {
  const { base, headers } = admin();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status}): ${await res.text()}`);
  return res;
}

export async function GET(request: Request) {
  // Vercel sends this header on scheduled invocations. Without the secret set,
  // this endpoint would be a public "email everyone" button.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ message: "Email is not configured." }, { status: 503 });

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://halftimedad.co").replace(/\/$/, "");
  const week = weekOf();

  const res = await rpc(`/rest/v1/rpc/sunday_nudge_candidates`, {
    method: "POST",
    body: JSON.stringify({ p_week: week }),
  });
  const candidates = (await res.json()) as Candidate[];

  let sent = 0;
  const failures: string[] = [];

  for (const person of candidates) {
    const payload = {
      firstName: person.first_name,
      lastNextRight: person.last_next_right,
      siteUrl,
      nudgeToken: person.nudge_token,
    };

    try {
      // Claim the send before mailing. If the send then fails, that man is
      // skipped this week rather than mailed twice next retry. A missed nudge
      // is a smaller harm than a duplicate.
      await rpc(`/rest/v1/nudge_sends`, {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ user_id: person.user_id, week_of: week, kind: "sunday" }),
      });

      const mail = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Bill at HalfTimeDad <bill@updates.halftimedad.co>",
          reply_to: "hello@halftimedad.co",
          to: person.email,
          subject: nudgeSubject(person.last_next_right),
          text: nudgeText(payload),
          html: nudgeHtml(payload),
        }),
      });
      if (!mail.ok) throw new Error(await mail.text());
      sent += 1;
    } catch (error) {
      console.error("Sunday nudge failed", person.user_id, error);
      failures.push(person.user_id);
    }
  }

  return NextResponse.json({ week, candidates: candidates.length, sent, failed: failures.length });
}
