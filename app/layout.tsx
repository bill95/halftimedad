import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Half Time Dad | Domestic Peace Monitor",
  description: "A completely unofficial dashboard for tracking the calm.",
  metadataBase: new URL("https://halftimedad.co"),
  openGraph: {
    title: "Domestic Peace Monitor",
    description: "Track the calm, one day at a time.",
    url: "https://halftimedad.co",
    siteName: "Half Time Dad",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
