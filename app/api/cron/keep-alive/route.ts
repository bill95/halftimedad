import { NextResponse } from "next/server";

/**
 * Supabase keep-alive job.
 *
 * Runs daily from a Vercel cron. One tiny read against founding_members so the
 * project never sits idle long enough to be paused for inactivity.
 */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 503 });

  try {
    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/founding_members?select=founder_number&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: "no-store" },
    );
    if (!res.ok) console.error("Keep-alive failed", res.status, await res.text());
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 502 });
  } catch (error) {
    console.error("Keep-alive failed", error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
