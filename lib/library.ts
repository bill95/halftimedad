import { createClient } from "@/lib/supabase/server";
import type { Access } from "@/lib/access";

/**
 * The library.
 *
 * Assets carry the situation they suit: focus areas, stages, custody
 * arrangements. A member's profile carries the same vocabulary, so matching
 * is a set intersection rather than a recommendation engine.
 *
 * The ordering is the product. A man in his first year with a body focus
 * should not have to scroll past money and legal to find the two things
 * written for him, and the room should not look empty when the shelf is
 * short.
 */

export type AssetKind = "guide" | "play" | "script";

export type Asset = {
  slug: string;
  title: string;
  dek: string | null;
  kind: AssetKind;
  medium: string;
  duration_min: number;
  focus_areas: string[];
  stages: string[];
  custody_fit: string[];
  source_issue: string | null;
  object_number: number | null;
  published_at: string | null;
};

export type ScoredAsset = Asset & { score: number; matchedFocus: boolean };

const SELECT =
  "slug, title, dek, kind, medium, duration_min, focus_areas, stages, custody_fit, source_issue, object_number, published_at";

/**
 * Scores an asset against a profile. Focus is weighted hardest because it is
 * the one thing the member chose most recently and can change in a click.
 */
export function scoreAsset(asset: Asset, profile: Access["profile"]): ScoredAsset {
  const focus = profile?.focus_now ?? null;
  const stage = profile?.stage ?? null;
  const custody = profile?.custody ?? null;

  const matchedFocus = Boolean(focus && asset.focus_areas?.includes(focus));
  let score = 0;
  if (matchedFocus) score += 4;
  if (stage && asset.stages?.includes(stage)) score += 2;
  if (custody && asset.custody_fit?.includes(custody)) score += 1;
  // A guide is a destination. Plays and scripts are things you do on the way.
  if (asset.kind === "guide") score += 1;

  return { ...asset, score, matchedFocus };
}

export async function getLibrary(profile: Access["profile"]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select(SELECT)
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error || !data) return { forYou: [] as ScoredAsset[], rest: [] as ScoredAsset[] };

  const scored = (data as Asset[])
    .map((asset) => scoreAsset(asset, profile))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  // Only things that match the current focus earn the top shelf. Everything
  // else stays visible rather than hidden behind a filter.
  const forYou = scored.filter((asset) => asset.matchedFocus).slice(0, 6);
  const forYouSlugs = new Set(forYou.map((asset) => asset.slug));
  const rest = scored.filter((asset) => !forYouSlugs.has(asset.slug));

  return { forYou, rest };
}

export async function getAsset(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assets")
    .select(`${SELECT}, body_md, media_url`)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  return (data as (Asset & { body_md: string | null; media_url: string | null }) | null) ?? null;
}

export const KIND_LABEL: Record<AssetKind, string> = {
  guide: "Guide",
  play: "Play",
  script: "Script",
};

/**
 * Where an object came from, said plainly.
 *
 * Six of these were published first in the welcome sequence. A member who
 * already read one is better served by being told so than by finding it
 * unattributed and wondering whether he is paying for reruns.
 */
export function provenance(asset: Pick<Asset, "source_issue" | "object_number" | "kind">) {
  if (!asset.source_issue) return null;
  const object =
    asset.object_number && asset.kind !== "guide"
      ? `${asset.kind === "play" ? "PLAY" : "SCRIPT"} ${String(asset.object_number).padStart(2, "0")}`
      : null;
  if (asset.source_issue.startsWith("welcome-")) {
    return object ? `${object}, first sent in your welcome emails` : "First sent in your welcome emails";
  }
  if (asset.source_issue.startsWith("guide-")) {
    return object ? `${object}, from the guide` : "From the guide";
  }
  return object;
}
