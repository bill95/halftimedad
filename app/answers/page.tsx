import type { Metadata } from "next";
import Link from "next/link";
import NotLegalAdvice from "@/components/NotLegalAdvice";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { PUBLISHED_ANSWERS } from "@/content/answers";

export const metadata: Metadata = {
  title: "Answers for dads navigating divorce",
  description:
    "Plain answers to the questions separated dads ask most: hostile texts, what to tell the kids, moving out. Education and peer perspective, not legal advice.",
  alternates: { canonical: "https://halftimedad.co/answers" },
  // Until at least one answer is published, there is nothing here to index.
  robots: PUBLISHED_ANSWERS.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
};

export default function AnswersIndex() {
  return (
    <>
      <SiteHeader />
      <main className="section-shell charter-page public-read">
        <p className="kicker">Answers</p>
        <h1>The questions dads ask at 11pm.</h1>
        <p className="charter-intro">
          Short, practical answers to the moments that come up most, each with a free tool for the one in front of you.
        </p>
        <div className="answer-list">
          {PUBLISHED_ANSWERS.length === 0 ? <p className="script-footnote">The first answers are on their way.</p> : null}
          {PUBLISHED_ANSWERS.map((answer) => (
            <Link key={answer.slug} href={`/answers/${answer.slug}`}>
              <strong>{answer.question}</strong>
              <span>{answer.short}</span>
            </Link>
          ))}
        </div>
        <NotLegalAdvice variant="full" />
      </main>
      <SiteFooter />
    </>
  );
}
