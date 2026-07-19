import Link from "next/link";
import ShareHalfTimeDad from "@/components/ShareHalfTimeDad";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { activateCheckoutSession } from "@/lib/membership";

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
  return <><SiteHeader/><main className="welcome-page section-shell"><p className="kicker">{confirmed?"Membership confirmed":"Confirmation pending"}</p><h1>{confirmed?"Welcome to the Founding Class.":"We’re confirming your membership."}</h1>{founderNumber?<p className="welcome-number">Founder #{founderNumber.padStart(3,"0")}</p>:null}<p>{confirmed?`Your membership is active. ${email?`Stripe sent a receipt to ${email}.`:"Stripe will send your receipt."} You’ll receive founding updates and access instructions as they become available.`:"If checkout completed successfully, Stripe and HalfTimeDad will confirm it by email. Please do not submit a second payment."}</p><div className="welcome-actions"><Link className="button button-primary" href="/peace-monitor">Open the Peace Monitor</Link><Link className="button button-secondary" href="/">Return home</Link></div><aside><strong>Perspective before reaction.</strong><span>Thank you for helping build the village.</span>{confirmed?<div className="welcome-share"><span>Know another dad who could use a calmer place to land?</span><ShareHalfTimeDad className="button-secondary" /></div>:null}</aside></main><SiteFooter/></>;
}
