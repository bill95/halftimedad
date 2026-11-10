import type { MetadataRoute } from "next";
import { PUBLIC_ASSET_SLUGS } from "@/content/public-assets";
import { PUBLISHED_ANSWERS } from "@/content/answers";

export default function sitemap(): MetadataRoute.Sitemap {
  const answers = PUBLISHED_ANSWERS.length > 0 ? ["/answers", ...PUBLISHED_ANSWERS.map((a) => `/answers/${a.slug}`)] : [];
  const pages = [
    "",
    "/peace-monitor",
    "/tell-the-kids",
    "/research",
    "/privacy",
    "/terms",
    ...PUBLIC_ASSET_SLUGS.map((slug) => `/read/${slug}`),
    ...answers,
  ];
  return pages.map((path) => ({
    url: `https://halftimedad.co${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/read/") || path.startsWith("/answers/") || path === "/tell-the-kids" ? 0.7 : 0.5,
  }));
}
