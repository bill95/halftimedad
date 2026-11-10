import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import NotLegalAdvice from "@/components/NotLegalAdvice";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { TrackOnMount } from "@/components/Attribution";
import { ANSWERS, getAnswer } from "@/content/answers";
import { NOT_LEGAL_ADVICE_FULL } from "@/lib/legal";
import { renderMarkdown } from "@/lib/markdown";

/**
 * A public answer page. See content/answers.ts for the rules. Drafts
 * (published: false) render with noindex and a review banner so Bill can read
 * them at their real URL before they go to search.
 */

export function generateStaticParams() {
  return ANSWERS.map((answer) => ({ slug: answer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const answer = getAnswer(slug);
  if (!answer) return { title: "Not found" };
  const url = `https://halftimedad.co/answers/${answer.slug}`;
  return {
    title: answer.question,
    description: answer.short,
    alternates: { canonical: url },
    robots: answer.published ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: answer.question,
      description: answer.short,
      url,
      siteName: "HalfTimeDad",
      type: "article",
      images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "HalfTimeDad" }],
    },
    twitter: { card: "summary_large_image", title: answer.question, description: answer.short, images: ["/og.jpg"] },
  };
}

export default async function AnswerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const answer = getAnswer(slug);
  if (!answer) notFound();

  // The question and the short answer, for search engines and AI assistants.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: answer.updated,
    publisher: { "@type": "Organization", name: "HalfTimeDad", url: "https://halftimedad.co" },
    mainEntity: [
      {
        "@type": "Question",
        name: answer.question,
        acceptedAnswer: { "@type": "Answer", text: `${answer.short} ${NOT_LEGAL_ADVICE_FULL}` },
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <TrackOnMount name="answer_read" props={{ slug: answer.slug, published: answer.published }} />
      <main className="section-shell charter-page public-read">
        {!answer.published ? (
          <div className="member-notice">
            <p>
              <strong>Draft for review.</strong> Not indexed and not linked anywhere. Set published to true in
              content/answers.ts once it is approved.
            </p>
          </div>
        ) : null}
        {answer.published ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        ) : null}

        <p className="kicker">
          <Link href="/answers">Answers</Link> · Education, not legal advice
        </p>
        <h1>{answer.question}</h1>
        <p className="answer-short">{answer.short}</p>

        <article className="asset-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(answer.body) }} />

        <aside className="public-read-next">
          <p className="kicker">Free tool</p>
          <h2>Have the moment in front of you right now?</h2>
          <p>{answer.tool.pitch}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={answer.tool.href}>
              {answer.tool.label}
            </Link>
          </div>
        </aside>

        <div className="legal-referral" role="note">
          <strong>Where this becomes a legal question</strong>
          <p>{answer.legalEdge}</p>
        </div>
        <NotLegalAdvice variant="full" />
      </main>
      <SiteFooter />
    </>
  );
}
