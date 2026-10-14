/**
 * Library pieces anyone can read at /read/<slug>, signed in or not.
 *
 * The library is member-only (assets RLS: paid members read published), so
 * these are fetched with the service role, and only slugs on this list ever
 * are. Adding a slug here publishes it to the open web and to search.
 */
export const PUBLIC_ASSET_SLUGS = ["the-first-exchange"] as const;

export function isPublicAsset(slug: string) {
  return (PUBLIC_ASSET_SLUGS as readonly string[]).includes(slug);
}
