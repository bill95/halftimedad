import { NextResponse } from "next/server";
import { runDueSteps } from "@/lib/onboarding";

/**
 * Free onboarding letters 2 to 4 (lib/onboarding.ts). Daily from a Vercel
 * cron. Idempotent through nudge_sends, so a retried run sends nothing twice.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  try {
    const results = await runDueSteps();
    const count = (outcome: string) => results.filter((r) => r.outcome === outcome).length;
    return NextResponse.json({ checked: results.length, sent: count("sent"), skipped: count("skipped"), already: count("already"), failed: count("failed") });
  } catch (error) {
    console.error("Onboarding cron failed", error);
    return NextResponse.json({ message: "Onboarding run failed." }, { status: 500 });
  }
}
