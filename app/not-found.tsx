import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata = { title: "Not here | HalfTimeDad" };

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell legal-page">
        <p className="kicker">404</p>
        <h1>That page is not here.</h1>
        <p>
          Either it moved or the link was wrong. Nothing you did caused this.
        </p>
        <div className="member-actions" style={{ marginTop: "1.5rem" }}>
          <Link className="button button-primary" href="/member">
            Back to your room
          </Link>
          <Link className="member-tile-link" href="/">
            Or the front page
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
