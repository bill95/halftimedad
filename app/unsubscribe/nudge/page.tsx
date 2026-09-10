import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Sunday notes off | HalfTimeDad",
  robots: { index: false, follow: false },
};

/**
 * One click, no sign-in. A recurring email that makes you log in to stop it
 * gets marked as spam instead, and the sending domain pays for that.
 */
export default async function UnsubscribeNudge({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const token = typeof t === "string" && /^[0-9a-f-]{36}$/i.test(t) ? t : null;

  let done = false;
  if (token) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const res = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/member_profiles?nudge_token=eq.${encodeURIComponent(token)}`,
        {
          method: "PATCH",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ weekly_nudge: false }),
          cache: "no-store",
        }
      );
      done = res.ok;
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="section-shell legal-page">
        <p className="kicker">Sunday notes</p>
        <h1>{done ? "Done. No more Sunday notes." : "We could not turn those off."}</h1>
        <p>
          {done
            ? "The check-in is still there when you want it, and nothing else changes about your membership."
            : "That link may have expired. Email hello@halftimedad.co and it gets handled by a person."}
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
