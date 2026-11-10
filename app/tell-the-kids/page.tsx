import type { Metadata } from "next";
import Link from "next/link";
import KidsTalkForm from "@/components/KidsTalkForm";
import NotLegalAdvice from "@/components/NotLegalAdvice";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const TITLE = "What to Tell the Kids";
const DESCRIPTION =
  "Free, private words for the hard conversations: moving out, a new schedule, a missed visit, someone new. Pick the moment and their ages, and get something you can actually say.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "https://halftimedad.co/tell-the-kids" },
  openGraph: {
    title: `${TITLE} | HalfTimeDad`,
    description: DESCRIPTION,
    url: "https://halftimedad.co/tell-the-kids",
    siteName: "HalfTimeDad",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "What to Tell the Kids by HalfTimeDad" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/og.jpg"] },
  robots: { index: true, follow: true },
};

export default function TellTheKidsPage() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell charter-page tool-page">
        <p className="kicker">Free · No sign-up to try</p>
        <h1>What to tell the kids.</h1>
        <p className="charter-intro">
          The conversation you are dreading usually goes better than you think, as long as it is short, true, and keeps
          the kids out of the middle. Pick the moment and their ages. You get words you can say out loud, the questions
          they are likely to ask, and what to leave out.
        </p>

        <div className="hero-script-card">
          <div className="hero-script-head">
            <span>What to Tell the Kids</span>
            <span>Not saved, not stored</span>
          </div>
          <KidsTalkForm />
        </div>

        <NotLegalAdvice variant="full" />
        <p className="script-footnote">
          Not a substitute for a pediatrician or a child therapist either. If something feels bigger than a hard
          conversation, it probably is, and that is worth a call. Have a message to send their other parent instead?{" "}
          <Link href="/#script">Try The Script</Link>.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
