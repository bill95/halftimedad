import type { Metadata } from "next";

/**
 * The Peace Monitor is the thing that gets forwarded, so its link preview has
 * to describe the Peace Monitor.
 *
 * Without this it inherited the root metadata, which is the Founding Hundred
 * pitch. A man forwarded the free tool to a friend and the friend's preview
 * asked him to buy a membership, which is exactly where sharing dies.
 */
export const metadata: Metadata = {
  title: "The Peace Monitor",
  description:
    "Count the days you kept it clean. A private, lighthearted tracker for dads, free and no account needed to start.",
  openGraph: {
    title: "The Peace Monitor",
    description:
      "Count the days you kept it clean. Free, private, and it only ever counts your side of it.",
    url: "https://halftimedad.co/peace-monitor",
    siteName: "HalfTimeDad",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "The Peace Monitor by HalfTimeDad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Peace Monitor",
    description: "Count the days you kept it clean. Free and private.",
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export default function PeaceMonitorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
