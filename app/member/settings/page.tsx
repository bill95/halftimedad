import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { createClient } from "@/lib/supabase/server";
import { requireAccess } from "@/lib/access";
import SettingsPanel from "./SettingsPanel";

export const metadata = {
  title: "Settings | HalfTimeDad",
  robots: { index: false, follow: false },
};

const BILLING_PORTAL = "https://billing.stripe.com/p/login/bJe5kE75h80cguI75Fd3i00";

export default async function SettingsPage() {
  const member = await requireAccess();
  const supabase = await createClient();

  const { data: prefs } = await supabase
    .from("member_profiles")
    .select("weekly_nudge")
    .eq("user_id", member.userId)
    .maybeSingle();

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} tier={member.tier} />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>Settings</span>
          <span>{member.tier === "paid" ? "Member" : "Free account"}</span>
        </div>
        <h1 className="member-greeting">Settings</h1>
        <p className="member-subhead">Everything about your account in one place.</p>

        <SettingsPanel
          email={member.email}
          tier={member.tier}
          weeklyNudge={prefs?.weekly_nudge ?? true}
          billingUrl={BILLING_PORTAL}
        />
      </main>
      <SiteFooter />
    </>
  );
}
