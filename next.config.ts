import type { NextConfig } from "next";

/**
 * Short links to say out loud on podcasts and print on cards. Each one lands
 * on the homepage (The Script is the hero) tagged with where it came from, so
 * the first-touch source shows up on signups, payments and the Monday
 * scoreboard. Add one line per show; see docs/outreach-links.md.
 */
const SHORT_LINKS: Record<string, { utm_source: string; utm_campaign: string }> = {
  scab: { utm_source: "dont-pick-the-scab", utm_campaign: "interview-2026-10" },
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return Object.entries(SHORT_LINKS).map(([slug, utm]) => ({
      source: `/${slug}`,
      destination: `/?utm_source=${utm.utm_source}&utm_campaign=${utm.utm_campaign}`,
      // Temporary, so a show's link can be repointed later without browsers caching it.
      permanent: false,
    }));
  },
};

export default nextConfig;
