import Link from "next/link";

/**
 * Header for pages behind the door.
 *
 * The marketing header sells the membership. Showing "Join the village" to a
 * man who already joined reads as though the site does not know him, so member
 * pages get the brand mark and a way out, nothing else.
 */
export default function MemberHeader({ founderNumber }: { founderNumber?: number | null }) {
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
        <div className="member-header-right">
          {founderNumber ? (
            <span className="member-header-number">
              Founder #{String(founderNumber).padStart(3, "0")}
            </span>
          ) : null}
          <Link className="member-header-signout" href="/auth/sign-out">
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
