/**
 * Upserts library assets from content/assets/*.md into public.assets.
 *
 * Front matter carries the metadata, the body carries the guide. Slug comes
 * from the filename, so the file is the source of truth and re-running is
 * safe. Content written by hand in a SQL editor is content that gets pasted
 * wrong; this exists so that never happens again.
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-assets.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const DIR = "content/assets";
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function parse(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: raw.trim() };

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const at = line.indexOf(":");
    if (at === -1) continue;
    const field = line.slice(0, at).trim();
    let value = line.slice(at + 1).trim();
    if (value.startsWith("[") && value.endsWith("]")) {
      meta[field] = value
        .slice(1, -1)
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
    } else {
      meta[field] = value;
    }
  }
  return { meta, body: raw.slice(match[0].length).trim() };
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const files = (await readdir(DIR)).filter((name) => name.endsWith(".md"));

if (files.length === 0) {
  console.log("Nothing in", DIR);
  process.exit(0);
}

for (const file of files) {
  const slug = basename(file, ".md");
  const { meta, body } = parse(await readFile(join(DIR, file), "utf8"));

  if (!meta.title || !meta.kind || !meta.duration_min) {
    console.error(`${slug}: needs title, kind and duration_min in front matter. Skipped.`);
    continue;
  }

  const row = {
    slug,
    title: meta.title,
    dek: meta.dek ?? null,
    medium: meta.medium ?? "text",
    kind: meta.kind,
    duration_min: Number(meta.duration_min),
    body_md: body,
    stages: meta.stages ?? [],
    focus_areas: meta.focus_areas ?? [],
    custody_fit: meta.custody_fit ?? [],
    published: meta.published === "true",
  };

  if (row.published) row.published_at = new Date().toISOString();

  const { error } = await supabase.from("assets").upsert(row, { onConflict: "slug" });

  if (error) {
    console.error(`${slug}: ${error.message}`);
  } else {
    console.log(`${slug}: ${body.length} chars, ${row.published ? "published" : "draft"}`);
  }
}
