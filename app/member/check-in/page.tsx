import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { createClient } from "@/lib/supabase/server";
import { requireMember, weekOf } from "@/lib/member";
import CheckInForm from "./CheckInForm";

export const metadata = {
  title: "The check-in | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function CheckInPage() {
  const member = await requireMember("member");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("check_ins")
    .select("holding_up, hardest, next_right")
    .eq("user_id", member.userId)
    .eq("week_of", weekOf())
    .maybeSingle();

  return (
    <>
      <MemberHeader />
      <main className="section-shell charter-page">
        <p className="kicker">{existing ? "Editing this week" : "This week"}</p>
        <h1>The check-in</h1>
        <p className="charter-intro">
          Three questions, same every week. Nobody else reads these. Short answers count.
        </p>
        <CheckInForm
          editing={Boolean(existing)}
          initial={{
            holding_up: existing?.holding_up ?? "",
            hardest: existing?.hardest ?? "",
            next_right: existing?.next_right ?? "",
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
