import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import FirstRun from "@/components/FirstRun";
import { createClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/access";
import { weekOf } from "@/lib/member";
import { selectPlay } from "@/lib/first-play";
import {
  CONFLICT,
  CUSTODY,
  FOCUS_AREAS,
  STAGES,
  labelFor,
  type Conflict,
  type Custody,
  type FocusArea,
  type Stage,
} from "@/content/profile-options";

export const metadata = {
  title: "Your room | HalfTimeDad",
  robots: { index: false, follow: false },
};

const LIBRARY_OPENS = new Date("2026-10-01T00:00:00Z");

function greeting(now = new Date()) {
  const hour = now.getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default async function MemberHome({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string; "checked-in"?: string }>;
}) {
  const member = await requireAccess();
  const params = await searchParams;
  const justCheckedIn = params["checked-in"] === "1";
  // Set when requirePaid() turns a free account away from a paid surface.
  // Without a message this reads as a broken link rather than a paywall.
  const cameFromLocked = params.locked === "1";
  const paid = member.tier === "paid";

  // The profile is the one thing both tiers must have. It is what makes the
  // play worth anything, and it is the only thing a free account gives back.
  if (!member.profile?.stage) {
    const { redirect } = await import("next/navigation");
    redirect("/welcome/profile");
  }

  const supabase = await createClient();
  const week = weekOf();
  const play = selectPlay(member.profile, week);

  const [{ data: thisWeek }, { data: badges }, { data: lastEntry }] = paid
    ? await Promise.all([
        supabase
          .from("check_ins")
          .select("id, created_at")
          .eq("user_id", member.userId)
          .eq("week_of", week)
          .maybeSingle(),
        supabase
          .from("member_badges")
          .select("badge_slug, earned_at, badges(label, description)")
          .eq("user_id", member.userId)
          .order("earned_at", { ascending: true }),
        // What he said he would do, from the most recent week that is not
        // this one. Three answers a week going into a void is the fastest
        // way to stop answering.
        supabase
          .from("check_ins")
          .select("week_of, next_right")
          .eq("user_id", member.userId)
          .lt("week_of", week)
          .not("next_right", "is", null)
          .order("week_of", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }, { data: null }];

  const done = Boolean(thisWeek);
  // badges(label) is a joined row; Supabase types it as object or array
  // depending on the relationship, so normalise before reading it.
  const badgeLabels = (badges ?? [])
    .map((row) => {
      const joined = row.badges as unknown;
      if (Array.isArray(joined)) return (joined[0] as { label?: string })?.label;
      return (joined as { label?: string } | null)?.label;
    })
    .filter((label): label is string => Boolean(label));
  const situation = [
    labelFor(STAGES, member.profile?.stage as Stage | null),
    labelFor(CUSTODY, member.profile?.custody as Custody | null),
    labelFor(CONFLICT, member.profile?.conflict as Conflict | null),
  ].filter(Boolean);
  const focus = labelFor(FOCUS_AREAS, member.profile?.focus_now as FocusArea | null);

  const daysToLibrary = Math.max(
    0,
    Math.ceil((LIBRARY_OPENS.getTime() - Date.now()) / 86_400_000)
  );

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} tier={member.tier} />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>HalfTimeDad</span>
          <span>
            {member.founderNumber
              ? `Founder #${String(member.founderNumber).padStart(3, "0")}`
              : "Free account"}
          </span>
        </div>

        <h1 className="member-greeting">
          {greeting()}
          {member.firstName ? `, ${member.firstName}` : ""}.
        </h1>
        <p className="member-subhead">
          {paid
            ? justCheckedIn
              ? "Logged. It is in your record now, and it is what decides what gets written next."
              : done
                ? "You checked in this week. Nothing else is asked of you."
                : "Nothing here is overdue. The check-in is open when you want it."
            : "One thing to work on this week, and the count. That is the free half."}
        </p>

        <FirstRun tier={member.tier} />

        {cameFromLocked && !paid ? (
          <section className="member-notice">
            <p>
              That part is for members. Your account, your count and this week&rsquo;s play stay
              free either way.
            </p>
          </section>
        ) : null}

        {lastEntry?.next_right ? (
          <section className="member-carry">
            <p className="member-carry-label">Last time, the next right thing was</p>
            <p className="member-carry-value">{lastEntry.next_right}</p>
          </section>
        ) : null}

        {/* The play. Computed from the profile, so it works before the
            library exists and it works for free accounts. */}
        <section className="member-card member-play">
          <div className="member-card-head">
            <span>This week&rsquo;s play</span>
            <span>{focus ?? "Your focus"}</span>
          </div>
          <p className="member-play-read">{play.read}</p>
          <h2 className="member-play-title">{play.title}</h2>
          <ol className="member-play-steps">
            {play.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="member-play-note">{play.note}</p>
          <Link className="member-tile-link" href="/welcome/profile?only=focus_now">
            Change your focus
          </Link>
        </section>

        {paid ? (
          <section className="member-card member-checkin">
            <div className="member-card-head">
              <span>The check-in</span>
              <span>{done ? "Done this week" : "3 questions"}</span>
            </div>
            {done ? (
              <>
                <p className="member-card-body">
                  Same three questions next week. If something changed, you can edit this week&rsquo;s
                  answers.
                </p>
                <div className="member-actions">
                  <Link className="button button-secondary" href="/member/check-in">
                    Edit this week
                  </Link>
                  <Link className="member-tile-link" href="/member/record">
                    Read your record
                  </Link>
                </div>
              </>
            ) : (
              <>
                <ul className="member-questions">
                  <li>How are you holding up?</li>
                  <li>What was hardest this week?</li>
                  <li>What&rsquo;s the next right thing?</li>
                </ul>
                <div className="member-actions">
                  <Link className="button button-primary" href="/member/check-in">
                    Start this week&rsquo;s check-in
                  </Link>
                  <Link className="member-tile-link" href="/member/record">
                    Read your record
                  </Link>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="member-card member-locked">
            <div className="member-card-head">
              <span>The check-in</span>
              <span className="member-pill">Members</span>
            </div>
            <p className="member-card-body">
              Three questions, once a week, kept as a record you can read back. It is the part of
              this that compounds, and it is the reason the library knows what to put in front of
              you.
            </p>
            <Link className="button button-primary" href="/#join">
              See what membership costs
            </Link>
          </section>
        )}

        <div className="member-grid">
          <section className="member-tile">
            <p className="member-tile-label">Your situation</p>
            <p className="member-tile-value">
              {situation.length ? situation.join(" · ") : "Not set yet"}
            </p>
            {focus ? <p className="member-tile-hint">Focus: {focus}</p> : null}
            <Link className="member-tile-link" href="/welcome/profile">
              Update
            </Link>
          </section>

          <section className="member-tile">
            <p className="member-tile-label">{paid ? "Standing" : "The count"}</p>
            <p className="member-tile-value">
              {paid
                ? badgeLabels.length
                  ? badgeLabels.join(", ")
                  : "None yet"
                : "Saved to your account"}
            </p>
            <p className="member-tile-hint">
              {paid && member.founderNumber ? "Permanent. Yours as long as you stay." : ""}
            </p>
            <div className="member-actions">
              {paid ? (
                <Link className="member-tile-link" href="/member/passages">
                  Mark what you have been through
                </Link>
              ) : null}
              <Link className="member-tile-link" href="/peace-monitor">
                Open the Peace Monitor
              </Link>
            </div>
          </section>
        </div>

        <section className="member-library">
          <div className="member-card-head">
            <span>The library</span>
            <span className="member-pill">
              {paid ? (daysToLibrary > 0 ? "Filling up" : "Open") : "Members"}
            </span>
          </div>
          <p className="member-card-body">
            {paid
              ? "Sorted by where you said you are, not by what was published last. What you write in the check-ins decides what gets written next."
              : "Guides written for the situation you just described, not for everybody. It opens October 1."}
          </p>
          {paid ? (
            <Link className="button button-secondary" href="/member/library">
              Open the library
            </Link>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
