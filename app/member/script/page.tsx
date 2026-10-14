import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { requireAccess } from "@/lib/access";
import ScriptForm from "@/components/ScriptForm";
import { FREE_MONTHLY_LIMIT } from "@/lib/script/options";

export const metadata = {
  title: "The script | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function ScriptPage() {
  const access = await requireAccess();

  return (
    <>
      <MemberHeader founderNumber={access.founderNumber} tier={access.tier} />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>The script</span>
          <span>{access.tier === "paid" ? "Members" : `${FREE_MONTHLY_LIMIT} free a month`}</span>
        </div>

        <h1 className="member-greeting">Say it so it lands.</h1>
        <p className="member-subhead">
          Write it the way you want to say it. You will get back a version you can send without it
          coming back at you later.
        </p>

        <ScriptForm mode="member" tier={access.tier} />

        <p className="script-footnote">
          Your messages are not stored. This is not legal advice and it is not a substitute for your
          attorney.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
