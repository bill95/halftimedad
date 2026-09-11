import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

/**
 * Header for pages behind the door.
 *
 * The marketing header sells the membership. Showing "Join the village" to a
 * man who already joined reads as though the site does not know him.
 *
 * There are five surfaces back here now and they used to be reachable only
 * from cards on the member home, which meant every page but that one was a
 * dead end. Free accounts see only what they have.
 */
export default function MemberHeader({
  founderNumber,
  tier = "paid",
}: {
  founderNumber?: number | null;
  tier?: "free" | "paid";
}) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/member">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <span>HalfTimeDad</span>
        </Link>
        {/* Deliberately not .site-header nav: that element is hidden below
            940px, which left members with no navigation at all on a phone. */}
        <nav className="member-nav" aria-label="Member navigation">
          {tier === "paid" ? (
            <>
              <Link href="/member/check-in">Check-in</Link>
              <Link href="/member/library">Library</Link>
              <Link href="/member/record">Record</Link>
              <Link href="/member/passages">Passages</Link>
            </>
          ) : null}
          <Link href="/peace-monitor">Monitor</Link>
        </nav>
        <div className="member-header-right">
          {founderNumber ? (
            <span className="member-header-number">
              Founder #{String(founderNumber).padStart(3, "0")}
            </span>
          ) : null}
          <Link className="member-header-signout" href="/member/settings">
            Settings
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
