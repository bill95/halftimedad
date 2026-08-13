import { redirect } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { createClient } from "@/lib/supabase/server";
import AcceptCharter from "./AcceptCharter";
import {
  CHARTER_CLAUSES,
  CHARTER_CLOSING,
  CHARTER_INTRO,
  CHARTER_TITLE,
  CHARTER_VERSION,
} from "@/content/charter";

export const metadata = {
  title: "The charter | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function CharterPage() {
  const supabase = await createClient();

  // getUser revalidates against Supabase. Never trust getSession here.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS scopes this to the caller's own row.
  const { data: profile } = await supabase
    .from("member_profiles")
    .select("charter_accepted_at, charter_version")
    .eq("user_id", user.id)
    .maybeSingle();

  // Already accepted this exact version: nothing to do here.
  if (profile?.charter_accepted_at && profile.charter_version === CHARTER_VERSION) {
    redirect("/member");
  }

  const reaccepting = Boolean(profile?.charter_accepted_at);

  return (
    <>
      <MemberHeader />
      <main className="section-shell charter-page">
        <p className="kicker">
          {reaccepting ? "The charter has changed" : "One thing before you go in"}
        </p>
        <h1>{CHARTER_TITLE}</h1>

        {CHARTER_INTRO.map((line) => (
          <p key={line.slice(0, 24)} className="charter-intro">
            {line}
          </p>
        ))}

        <ol className="charter-clauses">
          {CHARTER_CLAUSES.map((clause) => (
            <li key={clause.number}>
              <span className="charter-number">{clause.number}</span>
              <div>
                <h2>{clause.heading}</h2>
                <p>{clause.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {CHARTER_CLOSING.map((line) => (
          <p key={line.slice(0, 24)} className="charter-closing">
            {line}
          </p>
        ))}

        <AcceptCharter />

        <p className="charter-version">Charter version {CHARTER_VERSION}</p>
      </main>
      <SiteFooter />
    </>
  );
}
