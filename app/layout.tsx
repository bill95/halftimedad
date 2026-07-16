import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HalfTimeDad | Helping Dads Win the Second Half",
  description: "Practical tools, honest support, and a better playbook for divorced and co-parenting dads.",
  metadataBase: new URL("https://halftimedad.co"),
  openGraph: {
    title: "Become a Founding Dad",
    description: "Help build the practical toolkit divorced and co-parenting dads deserve.",
    url: "https://halftimedad.co",
    siteName: "HalfTimeDad",
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
