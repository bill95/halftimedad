import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import MemberHeader from "@/components/MemberHeader";
import { requirePaid } from "@/lib/access";
import { getAsset, KIND_LABEL, provenance } from "@/lib/library";
import { renderMarkdown } from "@/lib/markdown";

export const metadata = {
  title: "The library | HalfTimeDad",
  robots: { index: false, follow: false },
};

export default async function AssetPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await requirePaid();
  const { slug } = await params;
  const asset = await getAsset(slug);
  if (!asset) notFound();

  const source = provenance(asset);

  return (
    <>
      <MemberHeader founderNumber={member.founderNumber} />
      <main className="section-shell charter-page">
        <Link className="member-tile-link" href="/member/library">
          Back to the library
        </Link>
        <p className="kicker">
          {KIND_LABEL[asset.kind]} · {asset.duration_min} min
        </p>
        <h1>{asset.title}</h1>
        {asset.dek ? <p className="charter-intro">{asset.dek}</p> : null}
        {source ? <p className="library-source">{source}</p> : null}
        <article
          className="asset-body"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(asset.body_md ?? "") }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
