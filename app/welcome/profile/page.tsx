import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { requireMember } from "@/lib/member";
import ProfileForm from "./ProfileForm";

export const metadata = {
  title: "Where you are | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const member = await requireMember("profile");

  return (
    <>
      <SiteHeader />
      <main className="section-shell charter-page">
        <p className="kicker">Four questions</p>
        <h1>Where you are</h1>
        <p className="charter-intro">
          {member.firstName ? `${member.firstName}, this ` : "This "}
          decides what you get sent and what shows up in the library. Skip anything you would rather
          not answer. You can change all of it later, and nobody else sees it.
        </p>
        <ProfileForm />
      </main>
      <SiteFooter />
    </>
  );
}
