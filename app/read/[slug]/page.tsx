import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { TrackOnMount } from "@/components/Attribution";
import { isPublicAsset, PUBLIC_ASSET_SLUGS } from "@/content/public-assets";
import { KIND_LABEL } from "@/lib/library";
import { renderMarkdown } from "@/lib/markdown";
import { getPublishedAssetAsAdmin } from "@/lib/supabase-admin";

/**
 * A library piece anyone can read: the sample that shows what membership is.
 * Only slugs in content/public-assets.ts render here; everything else 404s,
 * so the member library stays member-only.
 */

export const revalidate = 3600;

export function generateStaticParams() {
  return PUBLIC_ASSET_SLUGS.map((slug) => ({ slug }));
}

async function load(slug: string) {
  if (!isPublicAsset(slug)) return null;
  return getPublishedAssetAsAdmin(slug).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const asset = await load(slug);
  if (!asset) return { title: "Not found" };
  const description = asset.dek ?? "From the HalfTimeDad library. Written from a real dad's experience.";
  return {
    title: asset.title,
    description,
    alternates: { canonical: `https://halftimedad.co/read/${asset.slug}` },
    openGraph: {
      title: asset.title,
      description,
      url: `https://halftimedad.co/read/${asset.slug}`,
      type: "article",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "HalfTimeDad" }],
    },
    twitter: { card: "summary_large_image", title: asset.title, description, images: ["/og.jpg"] },
  };
}

export default async function PublicAssetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const asset = await load(slug);
  if (!asset) notFound();

  return (
    <>
      <SiteHeader />
      <TrackOnMount name="play_read" props={{ slug: asset.slug, kind: asset.kind, surface: "public" }} />
      <main className="section-shell charter-page public-read">
        <p className="kicker">
          From the library · {KIND_LABEL[asset.kind]} · {asset.duration_min} min · Free to read
        </p>
        <h1>{asset.title}</h1>
        {asset.dek ? <p className="charter-intro">{asset.dek}</p> : null}
        <article className="asset-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(asset.body_md ?? "") }} />

        <aside className="public-read-next">
          <p className="kicker">If this helped</p>
          <h2>There is a whole library like it, and a tool for the message in front of you.</h2>
          <p>
            A free account gets you The Script three times a month, the Peace Monitor, and a play like this one every
            week. Founding members get the whole library, the weekly check-in, and The Script whenever they need it.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/login">
              Start free
            </Link>
            <Link className="text-link" href="/#script">
              Try The Script now →
            </Link>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
