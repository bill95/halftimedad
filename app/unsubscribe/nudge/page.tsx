import { redirect } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Email off",
  robots: { index: false, follow: false },
};

/**
 * One click, no sign-in. A recurring email that makes you log in to stop it
 * gets marked as spam instead, and the sending domain pays for that.
 *
 * The click is a real button, not the page load. Outlook Safe Links, Gmail and
 * corporate scanners open every link in an email before the reader does, and
 * a GET that changed state was turning members' Sunday notes off for them.
 */

const TOKEN = /^[0-9a-f-]{36}$/i;

async function turnOff(formData: FormData) {
  "use server";
  const raw = formData.get("t");
  const token = typeof raw === "string" && TOKEN.test(raw) ? raw : null;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let ok = false;

  if (token && url && key) {
    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/member_profiles?nudge_token=eq.${encodeURIComponent(token)}&select=user_id`,
      {
        method: "PATCH",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ weekly_nudge: false }),
        cache: "no-store",
      }
    );
    // A token that matches nobody used to report success too.
    ok = res.ok && ((await res.json()) as unknown[]).length > 0;
  }

  redirect(`/unsubscribe/nudge?done=${ok ? "1" : "0"}`);
}

export default async function UnsubscribeNudge({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string }>;
}) {
  const { t, done } = await searchParams;
  const token = typeof t === "string" && TOKEN.test(t) ? t : null;

  let heading: string;
  let body: React.ReactNode;

  if (done === "1") {
    heading = "Done. No more of these emails.";
    body = <p>No more Sunday notes or getting-started letters. Your account and everything in it stay exactly as they are. Receipts and sign-in links still arrive when you ask for them.</p>;
  } else if (done === "0" || !token) {
    heading = "We could not turn those off.";
    body = <p>That link may have expired. Email hello@halftimedad.co and it gets handled by a person.</p>;
  } else {
    heading = "Turn off these emails?";
    body = (
      <>
        <p>You will stop getting the Sunday check-in reminder and the getting-started letters. Nothing else about your account changes, and you can turn them back on in settings.</p>
        <form action={turnOff}>
          <input type="hidden" name="t" value={token} />
          <button type="submit" className="button button-primary">Turn them off</button>
        </form>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="section-shell legal-page">
        <p className="kicker">Email from HalfTimeDad</p>
        <h1>{heading}</h1>
        {body}
      </main>
      <SiteFooter />
    </>
  );
}
