import type { Metadata } from "next";
import "./globals.css";
import "./stripe.css";

export const metadata: Metadata = {
  title: { default: "HalfTimeDad | Perspective Before Reaction", template: "%s | HalfTimeDad" },
  description: "Practical tools and a supportive village helping dads think clearly, reduce stress, and keep their kids at the center.",
  metadataBase: new URL("https://halftimedad.co"),
  openGraph: {
    title: "HalfTimeDad | The Founding Hundred",
    description: "Perspective before reaction. Join the first 100 dads helping build the village before October 1, 2026.",
    url: "https://halftimedad.co",
    siteName: "HalfTimeDad",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "HalfTimeDad — Perspective before reaction" }],
  },
  twitter: { card: "summary_large_image", title: "HalfTimeDad | The Founding Hundred", description: "Perspective before reaction.", images: ["/og.jpg"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
