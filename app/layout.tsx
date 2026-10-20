import type { Metadata } from "next";
import "./globals.css";
import "./stripe.css";
import "./newsletter.css";
import { Analytics } from "@vercel/analytics/next";
import Attribution from "@/components/Attribution";

export const metadata: Metadata = {
  title: { default: "HalfTimeDad | Perspective Before Reaction", template: "%s | HalfTimeDad" },
  description: "Practical tools and a supportive village helping dads think clearly, reduce stress, and keep their kids at the center.",
  metadataBase: new URL("https://halftimedad.co"),
  openGraph: {
    title: "HalfTimeDad | The Founding Hundred",
    description: "Perspective before reaction. Join the first 100 dads helping build the village before January 31, 2027.",
    url: "https://halftimedad.co",
    siteName: "HalfTimeDad",
    type: "website",
    images: [{ url: "/og.jpg?v=2", width: 1200, height: 630, alt: "HalfTimeDad — Perspective before reaction" }],
  },
  twitter: { card: "summary_large_image", title: "HalfTimeDad | The Founding Hundred", description: "Perspective before reaction.", images: ["/og.jpg?v=2"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Attribution />
        <Analytics />
      </body>
    </html>
  );
}
