import type { MetadataRoute } from "next";
import { PUBLIC_ASSET_SLUGS } from "@/content/public-assets";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/peace-monitor", "/research", "/privacy", "/terms", ...PUBLIC_ASSET_SLUGS.map((slug) => `/read/${slug}`)];
  return pages.map((path) => ({
    url: `https://halftimedad.co${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/read/") ? 0.7 : 0.5,
  }));
}
