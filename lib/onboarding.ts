import { ONBOARDING_DAYS, onboardingLetter, type OnboardingStep } from "@/content/emails/onboarding";
import { sendLetter } from "@/lib/email";

/**
 * Free account onboarding (content/emails/onboarding.ts).
 *
 * Bookkeeping lives in nudge_sends, the table the Sunday nudge already uses:
 * one row per (user, signup date, "onboard_<step>"). The row is claimed
 * before the email is sent, so a retry or an overlapping cron run can never
 * mail a man twice. If the send then fails, the claim is released so the
 * next run tries again.
 *
 * Opting out: the same switch as the Sunday notes (member_profiles.weekly_nudge),
 * reached from the link at the bottom of every letter.
 */

function admin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin environment is not configured");
  return { base: url.replace(/\/$/, ""), headers: { apikey: key, Authorization: `Bearer ${key}` } };
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://halftimedad.co").replace(/\/$/, "");
}

export type OnboardingUser = { id: string; email: string; created_at: string };

const kind = (step: OnboardingStep) => `onboard_${step}`;
const signupDate = (user: OnboardingUser) => user.created_at.slice(0, 10);

async function claim(user: OnboardingUser, step: OnboardingStep) {
  const { base, headers } = admin();
  const res = await fetch(`${base}/rest/v1/nudge_sends?on_conflict=user_id,week_of,kind`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ user_id: user.id, week_of: signupDate(user), kind: kind(step) }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`nudge_sends claim failed (${res.status}): ${await res.text()}`);
  return ((await res.json()) as unknown[]).length === 1;
}

async function release(user: OnboardingUser, step: OnboardingStep) {
  const { base, headers } = admin();
  await fetch(
    `${base}/rest/v1/nudge_sends?user_id=eq.${user.id}&week_of=eq.${signupDate(user)}&kind=eq.${kind(step)}`,
    { method: "DELETE", headers, cache: "no-store" }
  ).catch(() => undefined);
}

type Prefs = { weekly_nudge: boolean; nudge_token: string | null };

async function prefsFor(userIds: string[]) {
  const { base, headers } = admin();
  const out = new Map<string, Prefs>();
  if (userIds.length === 0) return out;
  const res = await fetch(
    `${base}/rest/v1/member_profiles?user_id=in.(${userIds.join(",")})&select=user_id,weekly_nudge,nudge_token`,
    { headers, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`member_profiles read failed (${res.status})`);
  for (const row of (await res.json()) as Array<Prefs & { user_id: string }>) out.set(row.user_id, row);
  return out;
}

async function paidUserIds(userIds: string[]) {
  const { base, headers } = admin();
  if (userIds.length === 0) return new Set<string>();
  const res = await fetch(
    `${base}/rest/v1/founding_members?user_id=in.(${userIds.join(",")})&status=in.(active,past_due)&select=user_id`,
    { headers, cache: "no-store" }
  );
  if (!res.ok) throw new Error(`founding_members read failed (${res.status})`);
  return new Set(((await res.json()) as Array<{ user_id: string }>).map((r) => r.user_id));
}

async function firstNames(userIds: string[]) {
  const { base, headers } = admin();
  const out = new Map<string, string>();
  if (userIds.length === 0) return out;
  const res = await fetch(`${base}/rest/v1/founding_members?user_id=in.(${userIds.join(",")})&select=user_id,first_name`, {
    headers,
    cache: "no-store",
  });
  if (res.ok) for (const r of (await res.json()) as Array<{ user_id: string; first_name: string }>) out.set(r.user_id, r.first_name);
  return out;
}

/** Accounts created since a date, from the Supabase Auth admin API. */
export async function recentUsers(sinceMs: number) {
  const { base, headers } = admin();
  const users: OnboardingUser[] = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${base}/auth/v1/admin/users?page=${page}&per_page=200`, { headers, cache: "no-store" });
    if (!res.ok) throw new Error(`auth admin users failed (${res.status})`);
    const batch = ((await res.json()) as { users: Array<{ id: string; email?: string; created_at: string }> }).users ?? [];
    for (const u of batch) if (u.email && Date.parse(u.created_at) >= sinceMs) users.push({ id: u.id, email: u.email, created_at: u.created_at });
    if (batch.length < 200) break;
  }
  return users;
}

export type OnboardingResult = { step: OnboardingStep; userId: string; outcome: "sent" | "skipped" | "already" | "failed" };

/**
 * Sends one step to one user if it is not yet sent. This sequence is for free
 * accounts: a paying founder gets the founder welcome instead, so his steps
 * are claimed and skipped (claimed, so he is never picked up later).
 */
export async function sendStep(
  user: OnboardingUser,
  step: OnboardingStep,
  ctx: { prefs: Prefs | undefined; paid: boolean; firstName: string | null }
): Promise<OnboardingResult> {
  const base = { step, userId: user.id };
  if (!(await claim(user, step))) return { ...base, outcome: "already" };
  if (ctx.paid || ctx.prefs?.weekly_nudge === false) return { ...base, outcome: "skipped" };

  try {
    const letter = onboardingLetter(step, {
      firstName: ctx.firstName,
      siteUrl: siteUrl(),
      unsubscribeToken: ctx.prefs?.nudge_token ?? null,
    });
    await sendLetter(user.email, letter.subject, letter.html, letter.text);
    return { ...base, outcome: "sent" };
  } catch (error) {
    console.error(`Onboarding step ${step} failed for ${user.id}`, error);
    await release(user, step);
    return { ...base, outcome: "failed" };
  }
}

/** Step 1, at signup. Never throws: a welcome email must not break sign-in. */
export async function sendWelcomeStep(user: OnboardingUser) {
  try {
    const [prefs, paid, names] = await Promise.all([prefsFor([user.id]), paidUserIds([user.id]), firstNames([user.id])]);
    return await sendStep(user, 1, { prefs: prefs.get(user.id), paid: paid.has(user.id), firstName: names.get(user.id) ?? null });
  } catch (error) {
    console.error("Onboarding welcome failed", error);
    return null;
  }
}

/** Steps 2 to 4 for everyone who signed up in the last 12 days and is due. */
export async function runDueSteps(now = Date.now()) {
  const DAY = 86_400_000;
  const users = await recentUsers(now - 12 * DAY);
  const ids = users.map((u) => u.id);
  const [prefs, paid, names] = await Promise.all([prefsFor(ids), paidUserIds(ids), firstNames(ids)]);

  const results: OnboardingResult[] = [];
  for (const user of users) {
    const ageDays = (now - Date.parse(user.created_at)) / DAY;
    // Only the latest due step, so a man who signed up before this job existed
    // gets one letter, not three in one morning.
    const due = ([4, 3, 2] as OnboardingStep[]).find((step) => ageDays >= ONBOARDING_DAYS[step]);
    if (!due) continue;
    results.push(await sendStep(user, due, { prefs: prefs.get(user.id), paid: paid.has(user.id), firstName: names.get(user.id) ?? null }));
  }
  return results;
}
