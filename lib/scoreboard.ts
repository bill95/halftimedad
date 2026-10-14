import { countRows } from "@/lib/supabase-admin";
import { recentUsers } from "@/lib/onboarding";
import { sendLetter } from "@/lib/email";

/**
 * The Monday scoreboard: last week's numbers and the gates, in one email to
 * NOTIFY_EMAIL (default hello@halftimedad.co). It replaces opening dashboards
 * for the weekly 15-minute review.
 *
 * Everything here comes from what the app already records. Where visitors came
 * from lives in Vercel Analytics (funnel events carry `source`), so the email
 * links there instead of copying it.
 *
 * Gates from the roadmap:
 *   B  100 free accounts, and at least 1 in 3 has used The Script
 *   C  25 paid founders and 150 Sunday Reset subscribers by Dec 31, 2026
 */

const DAY = 86_400_000;
const GATE_B_FREE = 100;
const GATE_C_PAID = 25;
const GATE_C_NEWSLETTER = 150;

type Week = { since: string; until: string };

async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<{ value: T; ok: boolean }> {
  try {
    return { value: await fn(), ok: true };
  } catch (error) {
    console.error(`Scoreboard: ${label} failed`, error);
    return { value: fallback, ok: false };
  }
}

async function newsletterCounts(week: Week) {
  const key = process.env.RESEND_API_KEY;
  const audience = process.env.RESEND_AUDIENCE_ID;
  if (!key || !audience) throw new Error("Resend audience not configured");
  let total = 0;
  let fresh = 0;
  let after: string | undefined;
  for (let page = 0; page < 50; page++) {
    const url = new URL(`https://api.resend.com/audiences/${audience}/contacts`);
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" });
    if (!res.ok) throw new Error(`Resend contacts failed (${res.status})`);
    const body = (await res.json()) as { data?: Array<{ id: string; created_at: string; unsubscribed: boolean }>; has_more?: boolean };
    const rows = body.data ?? [];
    for (const c of rows) {
      if (c.unsubscribed) continue;
      total++;
      if (c.created_at >= week.since) fresh++;
    }
    if (!body.has_more || rows.length === 0) break;
    after = rows[rows.length - 1].id;
  }
  return { total, fresh };
}

async function scriptUsers(week: Week, paid: boolean | null) {
  const { base, headers } = (() => {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return { base: url.replace(/\/$/, ""), headers: { apikey: key, Authorization: `Bearer ${key}` } };
  })();
  const query = new URLSearchParams({ select: "user_id", created_at: `gte.${week.since}` });
  if (paid !== null) query.set("was_paid", `is.${paid}`);
  const res = await fetch(`${base}/rest/v1/script_usage?${query}`, { headers, cache: "no-store" });
  if (!res.ok) throw new Error(`script_usage read failed (${res.status})`);
  return new Set(((await res.json()) as Array<{ user_id: string }>).map((r) => r.user_id));
}

export async function buildScoreboard(now = Date.now()) {
  const week: Week = { since: new Date(now - 7 * DAY).toISOString(), until: new Date(now).toISOString() };
  const ever = new Date(Date.UTC(2025, 0, 1)).getTime();

  const [
    users,
    paidTotal,
    paidNew,
    checkoutsStarted,
    tries,
    freeRewrites,
    paidRewrites,
    everScriptUsers,
    monitorsNew,
    checkIns,
    onboardingSent,
    newsletter,
    paidWithAccount,
  ] = await Promise.all([
    safe("accounts", () => recentUsers(ever), []),
    safe("paid total", () => countRows("founding_members", { status: "in.(active,past_due)" }), 0),
    safe("paid new", () => countRows("founding_members", { status: "in.(active,past_due)", activated_at: `gte.${week.since}` }), 0),
    safe("checkouts", () => countRows("founding_reservations", { status: "in.(checkout_pending,converted)", updated_at: `gte.${week.since}` }), 0),
    safe("homepage tries", () => countRows("script_trials", { created_at: `gte.${week.since}` }), 0),
    safe("free rewrites", () => countRows("script_usage", { was_paid: "is.false", created_at: `gte.${week.since}` }), 0),
    safe("paid rewrites", () => countRows("script_usage", { was_paid: "is.true", created_at: `gte.${week.since}` }), 0),
    safe("script users ever", () => scriptUsers({ since: new Date(ever).toISOString(), until: week.until }, false), new Set<string>()),
    safe("monitors", () => countRows("monitor_state", { created_at: `gte.${week.since}` }), 0),
    safe("check-ins", () => countRows("check_ins", { created_at: `gte.${week.since}` }), 0),
    safe("onboarding", () => countRows("nudge_sends", { kind: "like.onboard_*", sent_at: `gte.${week.since}` }), 0),
    safe("newsletter", () => newsletterCounts(week), { total: 0, fresh: 0 }),
    // Founders who have signed in. A paid founder without an account (yet)
    // must not be subtracted from the free count.
    safe("paid with account", () => countRows("founding_members", { status: "in.(active,past_due)", user_id: "not.is.null" }), 0),
  ]);

  const accountsTotal = users.value.length;
  const accountsNew = users.value.filter((u) => u.created_at >= week.since).length;
  const freeTotal = Math.max(0, accountsTotal - paidWithAccount.value);
  const scriptAdoption = freeTotal > 0 ? Math.round((everScriptUsers.value.size / freeTotal) * 100) : 0;

  const failures = [users, paidTotal, paidNew, checkoutsStarted, tries, freeRewrites, paidRewrites, everScriptUsers, monitorsNew, checkIns, onboardingSent, newsletter, paidWithAccount]
    .filter((r) => !r.ok).length;

  return {
    week,
    funnel: {
      homepageTries: tries.value,
      newAccounts: accountsNew,
      checkoutsStarted: checkoutsStarted.value,
      newPaid: paidNew.value,
    },
    activity: {
      freeRewrites: freeRewrites.value,
      paidRewrites: paidRewrites.value,
      monitorsStarted: monitorsNew.value,
      checkIns: checkIns.value,
      onboardingLettersSent: onboardingSent.value,
      newsletterNew: newsletter.value.fresh,
    },
    totals: {
      freeAccounts: freeTotal,
      paidFounders: paidTotal.value,
      newsletter: newsletter.value.total,
      scriptAdoptionPct: scriptAdoption,
    },
    gates: {
      b: { free: freeTotal, freeTarget: GATE_B_FREE, adoptionPct: scriptAdoption, adoptionTarget: 33 },
      c: { paid: paidTotal.value, paidTarget: GATE_C_PAID, newsletter: newsletter.value.total, newsletterTarget: GATE_C_NEWSLETTER },
    },
    failures,
  };
}

export type Scoreboard = Awaited<ReturnType<typeof buildScoreboard>>;

function bar(value: number, target: number) {
  const filled = Math.max(0, Math.min(10, Math.round((value / target) * 10)));
  return `${"■".repeat(filled)}${"□".repeat(10 - filled)}`;
}

export function scoreboardEmail(s: Scoreboard) {
  const range = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" });
  const daysToLaunch = Math.ceil((Date.UTC(2027, 0, 31) - Date.parse(s.week.until)) / DAY);
  const daysToGateC = Math.ceil((Date.UTC(2026, 11, 31) - Date.parse(s.week.until)) / DAY);

  const lines = [
    `HalfTimeDad scoreboard, ${range(s.week.since)} to ${range(s.week.until)}`,
    `${daysToLaunch} days to public launch.`,
    "",
    "THIS WEEK'S FUNNEL",
    `  Homepage Script tries      ${s.funnel.homepageTries}`,
    `  New free accounts          ${s.funnel.newAccounts}`,
    `  Checkouts started          ${s.funnel.checkoutsStarted}`,
    `  New founding members       ${s.funnel.newPaid}`,
    "",
    "WHAT PEOPLE DID",
    `  Script rewrites (free)     ${s.activity.freeRewrites}`,
    `  Script rewrites (members)  ${s.activity.paidRewrites}`,
    `  Peace Monitors started     ${s.activity.monitorsStarted}`,
    `  Check-ins                  ${s.activity.checkIns}`,
    `  Onboarding letters sent    ${s.activity.onboardingLettersSent}`,
    `  New Sunday Reset subs      ${s.activity.newsletterNew}`,
    "",
    "GATE B: 100 free accounts, 1 in 3 using The Script",
    `  Free accounts   ${bar(s.gates.b.free, s.gates.b.freeTarget)}  ${s.gates.b.free} / ${s.gates.b.freeTarget}`,
    `  Script use      ${bar(s.gates.b.adoptionPct, s.gates.b.adoptionTarget)}  ${s.gates.b.adoptionPct}% / ${s.gates.b.adoptionTarget}%`,
    "",
    `GATE C: by Dec 31 (${daysToGateC} days)`,
    `  Paid founders   ${bar(s.gates.c.paid, s.gates.c.paidTarget)}  ${s.gates.c.paid} / ${s.gates.c.paidTarget}`,
    `  Sunday Reset    ${bar(s.gates.c.newsletter, s.gates.c.newsletterTarget)}  ${s.gates.c.newsletter} / ${s.gates.c.newsletterTarget}`,
    "",
    "Where visitors came from (sources on every funnel event):",
    "  https://vercel.com/turn-2-lab-s-projects/halftimedad/analytics",
    ...(s.failures ? ["", `Note: ${s.failures} number(s) could not be read this week and show as 0. Check the logs.`] : []),
  ];

  const text = lines.join("\n");
  const html = `<pre style="font-family:Menlo,Consolas,monospace;font-size:14px;line-height:1.55;color:#17231d">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")}</pre>`;
  const subject = `Scoreboard: ${s.funnel.newAccounts} new free, ${s.funnel.newPaid} new paid (${range(s.week.since)} to ${range(s.week.until)})`;
  return { subject, text, html };
}

export async function sendScoreboard(now = Date.now()) {
  const board = await buildScoreboard(now);
  const email = scoreboardEmail(board);
  await sendLetter(process.env.NOTIFY_EMAIL || "hello@halftimedad.co", email.subject, email.html, email.text);
  return board;
}
