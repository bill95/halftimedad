import Link from "next/link";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { FINDINGS, RESEARCH_UPDATED, type Citation } from "@/content/research";

export const metadata: Metadata = {
  title: "What the research says about dads after divorce | HalfTimeDad",
  description:
    "How a separated dad parents matters more than how many days he gets, and conflict is what hurts kids. The studies behind HalfTimeDad, in plain language.",
  alternates: { canonical: "https://halftimedad.co/research" },
  openGraph: {
    title: "What the research says about dads after divorce",
    description:
      "How you parent matters more than how often. The studies behind HalfTimeDad, in plain language.",
    url: "https://halftimedad.co/research",
    type: "article",
  },
};

function Source({ citation }: { citation: Citation }) {
  return (
    <li>
      {citation.url ? (
        <a href={citation.url} target="_blank" rel="noopener noreferrer">
          {citation.text}
        </a>
      ) : (
        citation.text
      )}
    </li>
  );
}

export default function ResearchPage() {
  return (
    <>
      <SiteHeader />
      <main className="research-page section-shell">
        <p className="kicker">The research</p>
        <h1>What the research says about dads after divorce.</h1>
        <p className="research-lede">
          Twenty-five years of studies point the same way. How you parent in the time you have
          matters more than how much time you get, and conflict between homes is what hurts kids.
          The second one is the part you control.
        </p>
        <p className="research-meta">
          {FINDINGS.length} findings · Updated {RESEARCH_UPDATED} · Every source links to the original
        </p>

        <ol className="research-list">
          {FINDINGS.map((finding, index) => (
            <li key={finding.slug} id={finding.slug} className="research-item">
              <div className="research-marker">
                <span className="research-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="research-stat">{finding.stat}</span>
              </div>
              <div className="research-body">
                <h2>{finding.headline}</h2>
                <p>{finding.summary}</p>
                {finding.caveat ? <p className="research-caveat">{finding.caveat}</p> : null}
                <ul className="research-sources" aria-label="Sources">
                  {finding.citations.map((citation) => (
                    <Source key={citation.text} citation={citation} />
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <section className="research-note">
          <h2>How to read this</h2>
          <p>
            Most of these studies show a link, not proof of cause. Families differ in ways research
            can't always measure. Two are randomized trials, the mediation study and the fathers'
            programs, which is the strongest evidence there is. None of this is a case about custody.
            It is a case for showing up well in whatever time you have.
          </p>
          <p>
            If you are struggling, you don't have to carry it alone. In the US, call or text 988 to
            reach the Suicide &amp; Crisis Lifeline.
          </p>
        </section>

        <section className="research-cta">
          <h2>Lower the temperature. Start with one message.</h2>
          <p>
            The Script rewrites a message to your co-parent so it lands calm. Your first rewrite is
            free with an account.
          </p>
          <div className="research-cta-actions">
            <Link className="button button-primary" href="/member/script">
              Try The Script
            </Link>
            <Link className="button button-secondary" href="/peace-monitor">
              Open the Peace Monitor
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
