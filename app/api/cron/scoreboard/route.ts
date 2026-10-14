import { NextResponse } from "next/server";
import { sendScoreboard } from "@/lib/scoreboard";

/**
 * The Monday scoreboard email (lib/scoreboard.ts). Vercel cron, Mondays
 * 15:00 UTC (8am PDT, 7am PST). Safe to trigger by hand with the cron secret.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  try {
    const board = await sendScoreboard();
    return NextResponse.json({ sent: true, funnel: board.funnel, totals: board.totals, failures: board.failures });
  } catch (error) {
    console.error("Scoreboard failed", error);
    return NextResponse.json({ message: "Scoreboard failed." }, { status: 500 });
  }
}
