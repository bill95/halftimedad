import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { requirePaid } from "@/lib/access";
import { getLibrary, KIND_LABEL, provenance, type ScoredAsset } from "@/lib/library";
import { FOCUS_AREAS, labelFor, type FocusArea } from "@/content/profile-options";

export const metadata = {
  title: "The library | HalfTimeDad",
  robots: { index: false, follow: false },
};

function AssetRow({ asset }: { asset: ScoredAsset }) {
  const source = provenance(asset);
  return (
    <li className="library-row">
      <Link href={`/member/library/${asset.slug}`}>
        <div className="library-row-meta">
          <span className="library-kind">{KIND_LABEL[asset.kind]}</span>
          <span>{asset.duration_min} min</span>
        </div>
        <h3>{asset.title}</h3>
        {asset.dek ? <p className="library-dek">{asset.dek}</p> : null}
        {source ? <p className="library-source">{source}</p> : null}
      </Link>
    </li>
  );
}

export default async function LibraryPage() {
  const member = await requirePaid();
  const { forYou, rest } = await getLibrary(member.profile);
  const focus = labelFor(FOCUS_AREAS, member.profile?.focus_now as FocusArea | null);

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} />
      <main className="section-shell member-home">
        <div className="member-masthead">
          <span>The library</span>
          <span>{forYou.length + rest.length} in here</span>
        </div>

        <h1 className="member-greeting">The library</h1>
        <p className="member-subhead">
          Sorted by where you said you are, not by what was published last. Change your focus and
          this changes with it.
        </p>

        {forYou.length ? (
          <section className="library-section">
            <div className="member-card-head">
              <span>For your focus</span>
              <span>{focus ?? "Not set"}</span>
            </div>
            <ul className="library-list">
              {forYou.map((asset) => (
                <AssetRow key={asset.slug} asset={asset} />
              ))}
            </ul>
          </section>
        ) : null}

        <section className="library-section">
          <div className="member-card-head">
            <span>{forYou.length ? "Everything else" : "Everything"}</span>
            <span>{rest.length}</span>
          </div>
          {rest.length ? (
            <ul className="library-list">
              {rest.map((asset) => (
                <AssetRow key={asset.slug} asset={asset} />
              ))}
            </ul>
          ) : (
            <p className="member-card-body">Nothing here yet.</p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
