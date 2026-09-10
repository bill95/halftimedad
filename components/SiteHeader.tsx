import Link from "next/link";

/**
 * Marketing header.
 *
 * The sign-in link is not optional furniture. Without it a member who lands
 * on the homepage has no way back into his own account except by knowing to
 * type /login, and a man who made a free account from the Peace Monitor has
 * no way back at all.
 */
export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <i />
            <i />
          </span>
          <span>HalfTimeDad</span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/#story">Our story</Link>
          <Link href="/#tools">Tools</Link>
          <Link href="/peace-monitor">Peace Monitor</Link>
          <Link href="/#join">Founding Hundred</Link>
        </nav>
        <div className="site-header-actions">
          <Link className="site-header-signin" href="/login">
            Sign in
          </Link>
          <Link className="button button-small" href="/#join">
            Join the village
          </Link>
        </div>
      </div>
    </header>
  );
}
