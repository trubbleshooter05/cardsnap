#!/usr/bin/env npx tsx
/**
 * Social Draft Generator
 * Generates TikTok / Instagram Reels / YouTube Shorts scripts and captions
 * for published SEO pages. Output is draft-only — no auto-posting.
 *
 * Usage:
 *   npx tsx distro/social-draft-generator.ts --site snapbrand --slug yoga-studio
 *   npx tsx distro/social-draft-generator.ts --site cardsnap --slug football
 *   npx tsx distro/social-draft-generator.ts --site fursbliss --slug omega-3-for-dogs
 *   npx tsx distro/social-draft-generator.ts --file outputs/snapbrand/batch-2026-04-07.json
 *
 * Output: distro/social-drafts/[site]-[slug]-[timestamp].json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "distro", "social-drafts");

const args = process.argv.slice(2);
const SITE = args.includes("--site") ? args[args.indexOf("--site") + 1] : null;
const SLUG = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const FILE = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;

function loadEnvKey(): string | null {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;
  return null;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0].message.content;
}

interface SocialPromptContext {
  site: string;
  slug: string;
  keyword: string;
  pageUrl: string;
  pageTitle: string;
  platform: "tiktok" | "instagram_reels" | "youtube_shorts";
}

function buildSocialPrompt(ctx: SocialPromptContext): string {
  const platformMap = {
    tiktok: "TikTok (15-60 sec, fast hook, educational/entertaining)",
    instagram_reels: "Instagram Reels (15-30 sec, visually driven, trending audio friendly)",
    youtube_shorts: "YouTube Shorts (30-60 sec, slightly more depth, strong CTA to page)",
  };

  return `You are a social media content strategist specializing in short-form video for SaaS and digital tools.

Generate a ${platformMap[ctx.platform]} script for this page:
Site: ${ctx.site}
Page: ${ctx.pageTitle}
URL: ${ctx.pageUrl}
Primary keyword: ${ctx.keyword}

Return JSON:
{
  "hook": "First 3 seconds — must stop the scroll. 10-15 words max. Question or bold claim.",
  "script": [
    "Line 1 — what the video covers",
    "Line 2 — key insight or value point",
    "Line 3 — key insight or value point",
    "Line 4 — key insight or value point",
    "Line 5 — call to action, mention the URL/site"
  ],
  "caption": "Full ${ctx.platform} caption with hook, value, CTA. Include URL ${ctx.pageUrl}. 3-5 sentences.",
  "hashtags": ["5-10 relevant hashtags without the # symbol"],
  "cta": "Verbal CTA to say at end — 1 sentence",
  "shot_suggestions": [
    "Brief description of what to show on screen for each line"
  ],
  "trending_audio_note": "Suggest audio style or trending sound type that fits this content"
}

Rules:
- Hook must create curiosity or FOMO
- Keep it educational, not salesy
- CTA must drive to the specific URL: ${ctx.pageUrl}
- No auto-posting — this is a draft for human review`;
}

interface SitePageConfig {
  siteId: string;
  siteName: string;
  baseUrl: string;
  defaultHashtags: string[];
}

const SITE_CONFIGS: Record<string, SitePageConfig> = {
  snapbrand: { siteId: "snapbrand", siteName: "SNAPBRAND", baseUrl: "https://snapbrand.io", defaultHashtags: ["logo", "branding", "smallbusiness", "aitools", "logodesign", "startups"] },
  cardsnap: { siteId: "cardsnap", siteName: "CardSnap", baseUrl: "https://cardsnap.io", defaultHashtags: ["sportscards", "psagrading", "tradingcards", "cardcollecting", "cardgrading", "hobbylife"] },
  movieslike: { siteId: "movieslike", siteName: "WatchThis", baseUrl: "https://watchthis.app", defaultHashtags: ["movies", "movierecommendations", "watchthis", "filmtok", "movietok", "netflix"] },
  fursbliss: { siteId: "fursbliss", siteName: "FursBliss", baseUrl: "https://www.fursbliss.com", defaultHashtags: ["doghealth", "petcare", "dogs", "doglongevity", "dogsupplements", "dogowner"] },
};

async function generateForPage(
  site: string, slug: string, keyword: string, title: string, apiKey: string
) {
  const config = SITE_CONFIGS[site];
  if (!config) { console.error(`Unknown site: ${site}`); return; }

  const pageUrl = `${config.baseUrl}/logo-generator/${slug}`;
  const platforms: Array<"tiktok" | "instagram_reels" | "youtube_shorts"> = ["tiktok", "instagram_reels", "youtube_shorts"];

  const drafts: unknown[] = [];
  for (const platform of platforms) {
    console.log(`  Generating ${platform} draft for ${site}/${slug}...`);
    try {
      const prompt = buildSocialPrompt({ site: config.siteName, slug, keyword, pageUrl, pageTitle: title, platform });
      const raw = await callOpenAI(prompt, apiKey);
      const generated = JSON.parse(raw);
      drafts.push({
        site,
        page_url: pageUrl,
        platform,
        ...generated,
        hashtags: [...(generated.hashtags ?? []), ...config.defaultHashtags].slice(0, 15),
        generated_at: new Date().toISOString(),
        status: "draft",
      });
      await new Promise((r) => setTimeout(r, 800));
    } catch (err) {
      console.error(`    ✗ ${platform}:`, err);
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(OUTPUT_DIR, `${site}-${slug}-${ts}.json`);
  fs.writeFileSync(out, JSON.stringify(drafts, null, 2));
  console.log(`  ✓ Wrote ${drafts.length} platform drafts to: ${out}`);
}

async function main() {
  if (!SITE || !SLUG) {
    if (FILE) {
      console.log("File-based generation — reading page metadata from output file...");
      const entries = JSON.parse(fs.readFileSync(path.resolve(FILE), "utf8")) as Array<{
        slug: string; keyword?: string; seoTitle?: string; title?: string; _meta?: { source: string };
      }>;
      const apiKey = loadEnvKey();
      if (!apiKey) { console.error("OPENAI_API_KEY not found"); process.exit(1); }

      const detectedSite = FILE.includes("snapbrand") ? "snapbrand"
        : FILE.includes("cardsnap") ? "cardsnap"
        : FILE.includes("fursbliss") ? "fursbliss"
        : "movieslike";

      for (const e of entries.slice(0, 3)) {
        const keyword = e.keyword ?? e.slug;
        const title = e.seoTitle ?? e.title ?? e.slug;
        await generateForPage(detectedSite, e.slug, keyword, title, apiKey);
      }
      return;
    }

    console.error("Usage: --site [site] --slug [slug] OR --file [path]");
    process.exit(1);
  }

  const apiKey = loadEnvKey();
  if (!apiKey) { console.error("OPENAI_API_KEY not found"); process.exit(1); }

  // Build keyword/title from concepts
  const conceptsPath = path.join(ROOT, "concepts", `${SITE}-concepts.json`);
  let keyword = SLUG;
  let title = SLUG;
  if (fs.existsSync(conceptsPath)) {
    const data = JSON.parse(fs.readFileSync(conceptsPath, "utf8"));
    const allConcepts = [
      ...(data.concepts ?? []),
      ...(data.grade_or_skip_concepts ?? []),
      ...(data.breed_concepts ?? []),
      ...(data.supplement_concepts ?? []),
      ...(data.glossary_concepts ?? []),
    ];
    const found = allConcepts.find((c: { slug: string; keyword?: string; title?: string; label?: string }) => c.slug === SLUG);
    if (found) {
      keyword = found.keyword ?? SLUG;
      title = found.title ?? found.label ?? SLUG;
    }
  }

  await generateForPage(SITE, SLUG, keyword, title, apiKey);
}

main().catch(console.error);
