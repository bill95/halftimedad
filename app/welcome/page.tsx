import Link from "next/link";
import ShareHalfTimeDad from "@/components/ShareHalfTimeDad";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getAccess } from "@/lib/access";
import { activateCheckoutSession } from "@/lib/membership";

/**
 * Where Stripe sends a founder after paying. Its one job is getting him into
 * his dashboard. It used to point at the Peace Monitor and promise access
 * instructions that nothing ever sent.
 */
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let founderNumber = "";
  let email = "";
  let confirmed = false;
  if (sessionId) {
    try {
      const session = await activateCheckoutSession(sessionId);
      confirmed = session.status === "complete" && session.payment_status !== "unpaid";
      founderNumber = session.metadata?.founder_number || "";
      email = session.customer_details?.email || session.customer_email || "";
    } catch (error) {
      console.error("Could not confirm Stripe Checkout session", error);
    }
  }

  const access = await getAccess().catch(() => null);
  const dashboardHref = access ? "/member" : `/login?from=welcome${email ? `&email=${encodeURIComponent(email)}` : ""}`;

  return (
    <>
      <SiteHeader />
      <main className="welcome-page section-shell">
        <p className="kicker">{confirmed ? "Membership confirmed" : "Confirmation pending"}</p>
        <h1>{confirmed ? "Welcome to the Founding Class." : "We’re confirming your membership."}</h1>
        {founderNumber ? <p className="welcome-number">Founder #{founderNumber.padStart(3, "0")}</p> : null}
        <p>
          {confirmed
            ? access
              ? "Your membership is active. Your dashboard is open and the check-in is waiting for you."
              : `Your membership is active. Open your dashboard and we’ll email a one-tap sign-in link${email ? ` to ${email}` : ""}. No password, ever. We also sent a welcome email with the same link.`
            : "If checkout completed successfully, Stripe and HalfTimeDad will confirm it by email. Please do not submit a second payment."}
        </p>
        <div className="welcome-actions">
          {confirmed ? (
            <Link className="button button-primary" href={dashboardHref}>Open your dashboard</Link>
          ) : (
            <Link className="button button-secondary" href="/">Return home</Link>
          )}
        </div>
        <aside>
          <strong>Perspective before reaction.</strong>
          <span>Thank you for helping build the village.</span>
          {confirmed ? (
            <div className="welcome-share">
              <span>Know another dad who could use a calmer place to land?</span>
              <ShareHalfTimeDad className="button-secondary" />
            </div>
          ) : null}
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
