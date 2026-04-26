#!/usr/bin/env npx tsx
/**
 * CardSnap SEO Generator
 * Two modes:
 *   1. grade-or-skip: generates NicheContent entries for new sports/categories
 *   2. card-entry: generates card detail entries for data/cards.json
 *
 * Usage:
 *   npx tsx generators/cardsnap-generator.ts --mode grade-or-skip
 *   npx tsx generators/cardsnap-generator.ts --mode card-entry
 *   npx tsx generators/cardsnap-generator.ts --mode grade-or-skip --slug football
 *   npx tsx generators/cardsnap-generator.ts --dry-run
 *   npx tsx generators/cardsnap-generator.ts --max 5
 *
 * Output:
 *   outputs/cardsnap/grade-or-skip-TIMESTAMP.json   — copy into lib/niche-content.ts
 *   outputs/cardsnap/card-entries-TIMESTAMP.json    — append into data/cards.json
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONCEPTS_FILE = path.join(ROOT, "concepts", "cardsnap-concepts.json");
const OUTPUT_DIR = path.join(ROOT, "outputs", "cardsnap");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const MODE = args.includes("--mode") ? args[args.indexOf("--mode") + 1] : "grade-or-skip";
const SLUG_FILTER = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const MAX = args.includes("--max") ? parseInt(args[args.indexOf("--max") + 1], 10) : 5;

function loadEnvKey(): string | null {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;
  const envPaths = [
    path.join(ROOT, "..", ".env.local"),
    path.join(process.env.HOME ?? "", ".hermes", ".env"),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const raw = fs.readFileSync(envPath, "utf8");
      const m = raw.match(/^OPENAI_API_KEY=(.+)$/m);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.6,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0].message.content;
}

function buildGradeOrSkipPrompt(concept: { slug: string; sport: string; keyword: string }): string {
  return `You are a sports card market expert writing for CardSnap, a card grading ROI tool.

Generate a complete NicheContent object for "${concept.sport}" cards.
Slug: "${concept.slug}"
Primary SEO keyword: "${concept.keyword}"

Return JSON with EXACTLY this structure:
{
  "slug": "${concept.slug}",
  "sport": "${concept.sport}",
  "category": "${concept.slug}",
  "seoTitle": "${concept.sport} Card Grading ROI Guide — When to Grade | CardSnap",
  "seoDescription": "155 char max — should grade-or-skip ${concept.sport} cards? See ROI by condition/era/player.",
  "h1": "Should You Grade Your ${concept.sport} Card?",
  "subtitle": "2 sentences explaining what this guide covers for ${concept.sport} collectors",
  "gradingLogic": [
    "5-7 bullet strings covering when grading makes sense for ${concept.sport} cards",
    "Each bullet is one complete sentence starting with a card type/era/condition"
  ],
  "keyCharacteristics": [
    { "title": "Key grading characteristic", "desc": "Why this matters for ${concept.sport} cards" },
    { "title": "Key grading characteristic", "desc": "Why this matters for ${concept.sport} cards" },
    { "title": "Key grading characteristic", "desc": "Why this matters for ${concept.sport} cards" },
    { "title": "Key grading characteristic", "desc": "Why this matters for ${concept.sport} cards" }
  ],
  "roiExamples": [
    {
      "cardName": "Real ${concept.sport} card example",
      "rawValue": 100,
      "psa9Value": 400,
      "psa10Value": 1200,
      "gradingCost": 50,
      "psa9Roi": 250,
      "psa10Roi": 1050,
      "verdict": "strong",
      "reason": "Why this card is worth grading"
    },
    {
      "cardName": "Real ${concept.sport} card example 2",
      "rawValue": 30,
      "psa9Value": 80,
      "psa10Value": 200,
      "gradingCost": 50,
      "psa9Roi": 0,
      "psa10Roi": 120,
      "verdict": "moderate",
      "reason": "Why grading is marginal for this card"
    },
    {
      "cardName": "Real ${concept.sport} common card",
      "rawValue": 5,
      "psa9Value": 15,
      "psa10Value": 40,
      "gradingCost": 50,
      "psa9Roi": -40,
      "psa10Roi": -15,
      "verdict": "skip",
      "reason": "Why grading is not worth it for this card"
    }
  ],
  "whenToGrade": [
    "5-6 specific scenarios where grading ${concept.sport} cards makes financial sense"
  ],
  "skipGrading": [
    "4-5 specific scenarios where you should NOT grade ${concept.sport} cards"
  ],
  "marketInsight": "2-3 sentences about current ${concept.sport} card market conditions, demand, and grading ROI trends"
}

Rules:
- Use REAL card names and realistic price estimates for ${concept.sport}
- Be specific to ${concept.sport} — not generic card advice
- Verdict options: "strong", "moderate", "skip"
- psa9Roi = psa9Value - rawValue - gradingCost
- psa10Roi = psa10Value - rawValue - gradingCost`;
}

function buildCardEntryPrompt(concept: {
  player: string; year: number; brand: string; sport: string;
}): string {
  const slugBase = `${concept.player.toLowerCase().replace(/\s+/g, "-")}-${concept.year}-${concept.brand.toLowerCase().replace(/\s+/g, "-")}`;
  return `You are a sports card market writer for CardSnap. Write a comprehensive market analysis for:

Player/Card: ${concept.player} ${concept.year} ${concept.brand}
Sport: ${concept.sport}

Return JSON:
{
  "slug": "${slugBase}-value",
  "playerName": "${concept.player}",
  "year": ${concept.year},
  "brand": "${concept.brand}",
  "setName": "${concept.brand}",
  "cardNumber": "estimated card number",
  "title": "${concept.year} ${concept.brand} ${concept.player}",
  "metaTitle": "${concept.player} ${concept.year} ${concept.brand} Value | PSA 10, PSA 9 & Raw Prices",
  "metaDescription": "155 char max — current values for ${concept.player} ${concept.year} ${concept.brand} by grade",
  "content": "HTML article 1200-1800 words with sections: card history, market values by grade (raw/PSA 8/9/10), population context, is it worth grading ROI analysis, what to look for when buying raw, related collecting angles",
  "rawValueLow": 0,
  "rawValueHigh": 0,
  "psa9Value": 0,
  "psa10Value": 0,
  "popCount": 0,
  "gradingVerdict": "worth_grading or skip_grading",
  "sport": "${concept.sport}",
  "relatedSlugs": ["2-3 related card slugs in same format"],
  "createdAt": "${new Date().toISOString()}",
  "updatedAt": "${new Date().toISOString()}"
}

Rules:
- Use realistic current market estimates (April 2026 pricing)
- HTML content must have proper <h2>, <h3>, <p>, <ul> tags
- gradingVerdict: "worth_grading" if psa10Value > rawValueHigh + $200, else "skip_grading"
- relatedSlugs: similar cards/players, same sport`;
}

const GENERATOR_SITE_BASE =
  (process.env.NEXT_PUBLIC_APP_URL ?? "https://getcardsnap.com").replace(/\/$/, "");

function buildGradeOrSkipSchema(slug: string, sport: string, seoTitle: string, seoDescription: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": seoTitle,
        "description": seoDescription,
        "url": `${GENERATOR_SITE_BASE}/grade-or-skip/${slug}`,
        "author": { "@type": "Organization", "name": "CardSnap" },
        "publisher": { "@type": "Organization", "name": "CardSnap" }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": GENERATOR_SITE_BASE },
          { "@type": "ListItem", "position": 2, "name": "Grade or Skip", "item": `${GENERATOR_SITE_BASE}/grade-or-skip` },
          { "@type": "ListItem", "position": 3, "name": `${sport} Cards` }
        ]
      }
    ]
  };
}

async function runGradeOrSkip(apiKey: string) {
  const data = JSON.parse(fs.readFileSync(CONCEPTS_FILE, "utf8"));
  let concepts = (data.grade_or_skip_concepts as Array<{
    slug: string; sport: string; keyword: string; priority: number; status: string;
  }>).filter((c) => c.status === "pending");

  if (SLUG_FILTER) concepts = concepts.filter((c) => c.slug === SLUG_FILTER);
  concepts = concepts.sort((a, b) => b.priority - a.priority).slice(0, MAX);

  if (concepts.length === 0) { console.log("No pending grade-or-skip concepts."); return; }
  console.log(`Generating ${concepts.length} grade-or-skip entries...`);

  const results: unknown[] = [];
  for (const concept of concepts) {
    console.log(`  ${concept.slug}...`);
    try {
      const raw = await callOpenAI(buildGradeOrSkipPrompt(concept), apiKey);
      const generated = JSON.parse(raw);
      results.push({
        ...generated,
        schema_jsonld: buildGradeOrSkipSchema(concept.slug, concept.sport, generated.seoTitle, generated.seoDescription),
        _meta: { generated_at: new Date().toISOString(), source: "cardsnap-generator", review_status: "pending" },
      });
      console.log(`    ✓ ${concept.slug}`);
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      console.error(`    ✗ ${concept.slug}:`, err);
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(OUTPUT_DIR, `grade-or-skip-${ts}.json`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n✓ Wrote ${results.length} entries to: ${out}`);
  console.log("After review, add each entry to ~/projects/cardsnap/lib/niche-content.ts");
  console.log("Then create ~/projects/cardsnap/app/grade-or-skip/[slug]/page.tsx for each.");
}

async function runCardEntry(apiKey: string) {
  const data = JSON.parse(fs.readFileSync(CONCEPTS_FILE, "utf8"));
  let concepts = (data.card_entry_concepts as Array<{
    player: string; year: number; brand: string; sport: string; priority: number; status: string;
  }>).filter((c) => c.status === "pending");

  concepts = concepts.sort((a, b) => b.priority - a.priority).slice(0, MAX);
  if (concepts.length === 0) { console.log("No pending card entry concepts."); return; }
  console.log(`Generating ${concepts.length} card entries...`);

  const results: unknown[] = [];
  for (const concept of concepts) {
    console.log(`  ${concept.player} ${concept.year} ${concept.brand}...`);
    try {
      const raw = await callOpenAI(buildCardEntryPrompt(concept), apiKey);
      const generated = JSON.parse(raw);
      results.push(generated);
      console.log(`    ✓ ${generated.slug}`);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`    ✗ ${concept.player}:`, err);
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(OUTPUT_DIR, `card-entries-${ts}.json`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n✓ Wrote ${results.length} entries to: ${out}`);
  console.log("After review, append into ~/projects/cardsnap/data/cards.json");
}

async function main() {
  if (DRY_RUN) {
    const data = JSON.parse(fs.readFileSync(CONCEPTS_FILE, "utf8"));
    const g = data.grade_or_skip_concepts.filter((c: { status: string }) => c.status === "pending");
    const e = data.card_entry_concepts.filter((c: { status: string }) => c.status === "pending");
    console.log(`[DRY RUN] mode=${MODE}`);
    console.log(`  Grade-or-skip pending: ${g.length}`);
    console.log(`  Card entries pending: ${e.length}`);
    return;
  }

  const apiKey = loadEnvKey();
  if (!apiKey) { console.error("OPENAI_API_KEY not found"); process.exit(1); }

  if (MODE === "grade-or-skip") await runGradeOrSkip(apiKey);
  else if (MODE === "card-entry") await runCardEntry(apiKey);
  else { console.error(`Unknown mode: ${MODE}. Use --mode grade-or-skip or --mode card-entry`); process.exit(1); }
}

main().catch(console.error);
