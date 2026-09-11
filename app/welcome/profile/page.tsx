import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { requireAccess } from "@/lib/access";
import ProfileForm from "./ProfileForm";

export const metadata = {
  title: "Where you are | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string }>;
}) {
  const member = await requireAccess();
  const { only } = await searchParams;
  const single = only === "focus_now" ? ("focus_now" as const) : undefined;

  return (
    <>
      <MemberHeader tier={member.tier} />
      <main className="section-shell charter-page">
        <p className="kicker">Four questions</p>
        <h1>Where you are</h1>
        <p className="charter-intro">
          {member.firstName ? `${member.firstName}, this ` : "This "}
          decides what you get sent and what shows up in the library. Skip anything you would rather
          not answer. You can change all of it later, and nobody else sees it.
        </p>
        <ProfileForm
          only={single}
          initial={{
            stage: (member.profile?.stage as never) ?? null,
            custody: (member.profile?.custody as never) ?? null,
            conflict: (member.profile?.conflict as never) ?? null,
            focus_now: (member.profile?.focus_now as never) ?? null,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
