import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import FirstRun from "@/components/FirstRun";
import Greeting from "@/components/Greeting";
import { createClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/access";
import { weekOf } from "@/lib/member";
import { selectPlay } from "@/lib/first-play";
import { getLibrary } from "@/lib/library";
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

export default async function MemberHome({
  searchParams,
}: {
  searchParams: Promise<{ locked?: string; "checked-in"?: string }>;
}) {
  const member = await requireAccess();
  const params = await searchParams;
  const justCheckedIn = params["checked-in"] === "1";
  const cameFromLocked = params.locked === "1";
  const paid = member.tier === "paid";

  if (!member.profile?.focus_now && !member.profile?.stage) {
    const { redirect } = await import("next/navigation");
    redirect("/welcome/profile");
  }

  const supabase = await createClient();
  const week = weekOf();
  const play = selectPlay(member.profile, week);

  const [{ data: thisWeek }, { count: weeksLogged }, { data: passages }, { data: monitor }, { data: lastEntry }] =
    await Promise.all([
      paid
        ? supabase
            .from("check_ins")
            .select("id")
            .eq("user_id", member.userId)
            .eq("week_of", week)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      paid
        ? supabase
            .from("check_ins")
            .select("id", { count: "exact", head: true })
            .eq("user_id", member.userId)
        : Promise.resolve({ count: 0 }),
      supabase
        .from("member_badges")
        .select("badge_slug, badges!inner(kind)")
        .eq("user_id", member.userId)
        .eq("badges.kind", "passage"),
      supabase
        .from("monitor_state")
        .select("streak_started_at")
        .eq("user_id", member.userId)
        .maybeSingle(),
      paid
        ? supabase
            .from("check_ins")
            .select("next_right")
            .eq("user_id", member.userId)
            .lt("week_of", week)
            .not("next_right", "is", null)
            .order("week_of", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const { forYou } = paid
    ? await getLibrary(member.profile)
    : { forYou: [] as Awaited<ReturnType<typeof getLibrary>>["forYou"] };
  const nextRead = forYou[0] ?? null;

  const done = Boolean(thisWeek);
  const cleanDays = monitor?.streak_started_at
    ? Math.max(0, Math.floor((Date.now() - Date.parse(monitor.streak_started_at)) / 86_400_000))
    : null;
  const passageCount = passages?.length ?? 0;

  const situation = [
    labelFor(STAGES, member.profile?.stage as Stage | null),
    labelFor(CUSTODY, member.profile?.custody as Custody | null),
    labelFor(CONFLICT, member.profile?.conflict as Conflict | null),
  ].filter(Boolean);
  const focus = labelFor(FOCUS_AREAS, member.profile?.focus_now as FocusArea | null);

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} tier={member.tier} />
      <main className="room">
        <header className="room-head">
          <h1>
            <Greeting firstName={member.firstName} />
          </h1>
          <p>
            {paid
              ? justCheckedIn
                ? "Logged. It sits in your record now."
                : done
                  ? "You checked in this week. Nothing else is asked of you."
                  : "Nothing here is overdue."
              : "One thing to work on this week, and the count. That is the free half."}
          </p>
        </header>

        <FirstRun tier={member.tier} />

        {cameFromLocked && !paid ? (
          <section className="member-notice">
            <p>
              That part is for members. Your account, your count and this week&rsquo;s play stay free
              either way.
            </p>
          </section>
        ) : null}

        <div className="room-grid">
          {/* One element carries the page. Everything else stays quiet. */}
          <article className="play-panel">
            <p className="play-panel-focus">{focus ?? "This week"}</p>
            <p className="play-panel-read">{play.read}</p>
            <h2>{play.title}</h2>
            <ol>
              {play.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="play-panel-note">{play.note}</p>
            <Link href="/welcome/profile?only=focus_now">Change your focus</Link>
          </article>

          <aside className="room-rail">
            {cleanDays !== null ? (
              <div className="rail-figure">
                <span className="rail-figure-number">{cleanDays}</span>
                <span className="rail-figure-label">
                  {cleanDays === 1 ? "day kept clean" : "days kept clean"}
                </span>
                <Link href="/peace-monitor">Open the monitor</Link>
              </div>
            ) : (
              <div className="rail-figure rail-figure-empty">
                <span className="rail-figure-label">You have not started the count.</span>
                <Link href="/peace-monitor">Start it</Link>
              </div>
            )}

            {paid ? (
              <div className="rail-item">
                <h3>{done ? "Checked in" : "The check-in"}</h3>
                {lastEntry?.next_right ? (
                  <blockquote>{lastEntry.next_right}</blockquote>
                ) : (
                  <p>
                    {done
                      ? "Same three questions next week."
                      : "Three questions. Nobody else reads them."}
                  </p>
                )}
                <Link href={done ? "/member/record" : "/member/check-in"}>
                  {done ? "Read your record" : "Start this week"}
                </Link>
              </div>
            ) : (
              <div className="rail-item">
                <h3>The check-in</h3>
                <p>
                  Three questions a week, kept as a record you can read back. It is the part that
                  compounds.
                </p>
                <Link href="/#join">What membership costs</Link>
              </div>
            )}

            {paid && nextRead ? (
              <div className="rail-item">
                <h3>Next in the library</h3>
                <p className="rail-read-title">{nextRead.title}</p>
                <p>{nextRead.dek}</p>
                <Link href={`/member/library/${nextRead.slug}`}>
                  Read it, {nextRead.duration_min} min
                </Link>
              </div>
            ) : null}

            {paid ? (
              <div className="rail-item rail-counts">
                <p>
                  <span>{weeksLogged ?? 0}</span> {weeksLogged === 1 ? "week logged" : "weeks logged"}
                </p>
                <p>
                  <span>{passageCount}</span> {passageCount === 1 ? "passage marked" : "passages marked"}
                </p>
                <Link href="/member/passages">Mark what you have been through</Link>
              </div>
            ) : null}

            <div className="rail-item rail-situation">
              <h3>Where you are</h3>
              <p>{situation.length ? situation.join(". ") : "Not set yet"}</p>
              <Link href="/welcome/profile">Update</Link>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
