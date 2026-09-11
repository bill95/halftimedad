import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { createClient } from "@/lib/supabase/server";
import { requirePaid } from "@/lib/access";
import PassageList from "./PassageList";

export const metadata = {
  title: "What you have been through | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function PassagesPage() {
  const member = await requirePaid();
  const supabase = await createClient();

  const [{ data: badges }, { data: mine }] = await Promise.all([
    supabase
      .from("badges")
      .select("slug, label, description, sort_order")
      .eq("kind", "passage")
      .eq("self_claim", true)
      .order("sort_order", { ascending: true }),
    supabase.from("member_badges").select("badge_slug").eq("user_id", member.userId),
  ]);

  const claimed = new Set((mine ?? []).map((row) => row.badge_slug));
  const passages = (badges ?? []).map((badge) => ({
    slug: badge.slug,
    label: badge.label,
    description: badge.description,
    claimed: claimed.has(badge.slug),
  }));
  const count = passages.filter((passage) => passage.claimed).length;

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} tier={member.tier} />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>What you have been through</span>
          <span>{count ? `${count} marked` : "None marked"}</span>
        </div>

        <h1 className="member-greeting">What you have been through</h1>
        <p className="member-subhead">
          Tap the ones you have been through. Nothing to write, nobody to tell. This is a list of
          hard things, and getting past one is worth marking even if you did it badly.
        </p>

        <PassageList initial={passages} />

        <p className="passage-note">
          Only you see this. You can undo any of them.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
