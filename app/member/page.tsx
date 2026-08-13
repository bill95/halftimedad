import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { createClient } from "@/lib/supabase/server";
import { requireMember, weekOf } from "@/lib/member";
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

export default async function MemberHome() {
  const member = await requireMember("member");
  const supabase = await createClient();
  const week = weekOf();

  const [{ data: thisWeek }, { data: badges }] = await Promise.all([
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
  ]);

  const done = Boolean(thisWeek);
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
      <SiteHeader />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>HalfTimeDad</span>
          <span>
            {member.founderNumber
              ? `Founder #${String(member.founderNumber).padStart(3, "0")}`
              : "Member"}
          </span>
        </div>

        <h1 className="member-greeting">
          {greeting()}
          {member.firstName ? `, ${member.firstName}` : ""}.
        </h1>
        <p className="member-subhead">
          {done
            ? "You checked in this week. Nothing else is asked of you."
            : "Nothing here is overdue. The check-in is open when you want it."}
        </p>

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
              <Link className="button button-secondary" href="/member/check-in">
                Edit this week
              </Link>
            </>
          ) : (
            <>
              <ul className="member-questions">
                <li>How are you holding up?</li>
                <li>What was hardest this week?</li>
                <li>What&rsquo;s the next right thing?</li>
              </ul>
              <Link className="button button-primary" href="/member/check-in">
                Start this week&rsquo;s check-in
              </Link>
            </>
          )}
        </section>

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
            <p className="member-tile-label">Standing</p>
            <p className="member-tile-value">
              {badges?.length ? badges.map((b) => b.badge_slug.replace(/_/g, " ")).join(", ") : "—"}
            </p>
            <p className="member-tile-hint">
              {member.founderNumber ? "Permanent. Yours as long as you stay." : ""}
            </p>
          </section>
        </div>

        <section className="member-library">
          <div className="member-card-head">
            <span>The library</span>
            <span className="member-pill">
              {daysToLibrary > 0 ? `Opens in ${daysToLibrary} days` : "Open"}
            </span>
          </div>
          <p className="member-card-body">
            Built around where you actually are, not a list of everything. What you write in the
            check-ins between now and then decides what goes in it first.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
