import { redirect } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { requireAccess } from "@/lib/access";
import UpgradeForm from "./UpgradeForm";

export const metadata = {
  title: "Founding membership",
  robots: { index: false, follow: false },
};

/**
 * The upgrade, inside the product. Every "members only" moment points here
 * rather than back to the homepage form, so a free account is one tap from
 * Stripe with his email already known.
 */
export default async function UpgradePage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const access = await requireAccess();
  if (access.tier === "paid") redirect("/member");
  const { checkout } = await searchParams;

  return (
    <>
      <MemberHeader founderNumber={null} tier={access.tier} />
      <main className="section-shell member-home upgrade-page">
        <div className="member-masthead">
          <span>Founding membership</span>
          <span>Price locked while you stay</span>
        </div>

        <h1 className="member-greeting">Everything, for as long as you need it.</h1>
        <p className="member-subhead">
          You already have the free half. Membership opens the rest, at the founding price, for as long as you stay.
        </p>

        {checkout === "cancelled" ? (
          <section className="member-notice">
            <p>Checkout was cancelled and nothing was charged. Your free account is exactly as it was.</p>
          </section>
        ) : null}

        <div className="upgrade-grid">
          <ul className="upgrade-list">
            <li>
              <strong>The whole library</strong>
              <span>Plays, scripts and guides for exchanges, money, dating, your body and the first year, matched to where you are.</span>
            </li>
            <li>
              <strong>The weekly check-in</strong>
              <span>Three questions on Sunday, two minutes, and a record of how the weeks are actually going.</span>
            </li>
            <li>
              <strong>The Script, whenever you need it</strong>
              <span>Up to 100 rewrites a month instead of 3.</span>
            </li>
            <li>
              <strong>A permanent founder number</strong>
              <span>And a direct line to Bill. Reply to any email and it reaches him.</span>
            </li>
          </ul>
          <UpgradeForm firstName={access.firstName ?? ""} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
