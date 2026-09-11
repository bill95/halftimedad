import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { createClient } from "@/lib/supabase/server";
import { requirePaid } from "@/lib/access";
import { holdingUpLabel } from "@/content/check-in";

export const metadata = {
  title: "Your record | HalfTimeDad",
  robots: { index: false, follow: false },
};

function weekLabel(weekOf: string) {
  const date = new Date(`${weekOf}T00:00:00Z`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function RecordPage() {
  const member = await requirePaid();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("check_ins")
    .select("week_of, holding_up, hardest, next_right")
    .eq("user_id", member.userId)
    .order("week_of", { ascending: false })
    .limit(52);

  const rows = entries ?? [];

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} tier={member.tier} />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>Your record</span>
          <span>{rows.length ? `${rows.length} week${rows.length === 1 ? "" : "s"}` : "Empty"}</span>
        </div>

        <h1 className="member-greeting">Your record</h1>
        <p className="member-subhead">
          Every check-in you have written, most recent first. Nobody else reads these.
        </p>

        {rows.length ? (
          <>
            <section className="record-trend" aria-label="How the weeks have gone">
              {[...rows]
                .reverse()
                .slice(-26)
                .map((row) => (
                  <span
                    key={row.week_of}
                    className={`record-bar level-${row.holding_up}`}
                    title={`${weekLabel(row.week_of)}: ${holdingUpLabel(row.holding_up) ?? ""}`}
                  />
                ))}
            </section>

            <ul className="record-list">
              {rows.map((row) => (
                <li key={row.week_of} className="record-entry">
                  <div className="member-card-head">
                    <span>Week of {weekLabel(row.week_of)}</span>
                    <span>{holdingUpLabel(row.holding_up)}</span>
                  </div>
                  {row.hardest ? (
                    <p className="record-line">
                      <span>Hardest</span>
                      {row.hardest}
                    </p>
                  ) : null}
                  {row.next_right ? (
                    <p className="record-line">
                      <span>Next right thing</span>
                      {row.next_right}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <section className="member-card">
            <p className="member-card-body">
              Nothing here yet. The first check-in takes about two minutes, and this page is what it
              turns into.
            </p>
            <Link className="button button-primary" href="/member/check-in">
              Start this week&rsquo;s check-in
            </Link>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
