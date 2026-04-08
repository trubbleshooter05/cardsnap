#!/usr/bin/env npx tsx
/**
 * SnapBrand SEO Generator
 * Reads concepts/snapbrand-concepts.json and generates BUSINESS_TYPE_CONFIG
 * entries using OpenAI. Outputs reviewable JSON to outputs/snapbrand/.
 *
 * Usage:
 *   npx tsx generators/snapbrand-generator.ts                   # process all pending
 *   npx tsx generators/snapbrand-generator.ts --slug yoga-studio # single slug
 *   npx tsx generators/snapbrand-generator.ts --dry-run          # preview only
 *   npx tsx generators/snapbrand-generator.ts --max 5            # limit batch size
 *
 * After review, copy approved entries into:
 *   ~/projects/snapbrand/app/logo-generator/[business-type]/config.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONCEPTS_FILE = path.join(ROOT, "concepts", "snapbrand-concepts.json");
const OUTPUT_DIR = path.join(ROOT, "outputs", "snapbrand");

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SLUG_FILTER = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const MAX = args.includes("--max") ? parseInt(args[args.indexOf("--max") + 1], 10) : 10;

// ── OpenAI setup ──────────────────────────────────────────────────────────────
function loadEnvKey(): string | null {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;
  const envPath = path.join(path.dirname(ROOT), "snapbrand", ".env.local");
  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, "utf8");
    const m = raw.match(/^OPENAI_API_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return null;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0].message.content;
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt(concept: { slug: string; label: string; keyword: string; related_slugs: string[] }): string {
  return `You are an expert SEO content writer for SNAPBRAND, an AI logo and brand generator tool.

Generate a complete BUSINESS_TYPE_CONFIG entry for the "${concept.label}" business type.
Slug: "${concept.slug}"
Primary keyword: "${concept.keyword}"
Related slugs: ${JSON.stringify(concept.related_slugs)}

Return a JSON object with EXACTLY this structure:
{
  "label": "${concept.label}",
  "keyword": "${concept.keyword}",
  "seoTitle": "60 chars max, includes '${concept.keyword}' and 'SNAPBRAND'",
  "seoDescription": "155 chars max, compelling, includes primary keyword, ends with call to action",
  "description": "2-3 sentences describing what this page is for",
  "benefits": [
    { "icon": "emoji", "title": "Short benefit title", "desc": "1-2 sentences specific to this business type" },
    { "icon": "emoji", "title": "Short benefit title", "desc": "1-2 sentences specific to this business type" },
    { "icon": "emoji", "title": "Short benefit title", "desc": "1-2 sentences specific to this business type" },
    { "icon": "emoji", "title": "Short benefit title", "desc": "1-2 sentences specific to this business type" }
  ],
  "faqItems": [
    { "q": "Question specific to ${concept.label} businesses?", "a": "Answer" },
    { "q": "Question specific to ${concept.label} businesses?", "a": "Answer" },
    { "q": "Question specific to ${concept.label} businesses?", "a": "Answer" },
    { "q": "Question specific to ${concept.label} businesses?", "a": "Answer" },
    { "q": "Question specific to ${concept.label} businesses?", "a": "Answer" }
  ],
  "relatedTypes": [
    { "slug": "${concept.related_slugs[0] ?? "restaurant"}", "label": "Label" },
    { "slug": "${concept.related_slugs[1] ?? "ecommerce"}", "label": "Label" },
    { "slug": "${concept.related_slugs[2] ?? "startup"}", "label": "Label" }
  ],
  "ctaFormSubmit": "Industry-specific CTA verb phrase, e.g. 'Generate My ${concept.label} Logo'",
  "ctaBottom": "Bottom section CTA text",
  "ctaSectionBlurb": "1-2 sentences of supporting copy for the bottom CTA section"
}

Rules:
- All content must be SPECIFIC to the ${concept.label} industry, not generic
- Benefits must address pain points specific to this business type
- FAQs must answer questions this business type would actually ask
- seoTitle must stay under 60 characters
- seoDescription must stay under 155 characters
- Return only the JSON object, no extra text`;
}

// ── Schema builder ────────────────────────────────────────────────────────────
function buildSchema(slug: string, seoTitle: string, seoDescription: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "SNAPBRAND Logo Generator",
        "applicationCategory": "DesignApplication",
        "description": seoDescription,
        "url": `https://snapbrand.io/logo-generator/${slug}`,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "description": "Free to start"
        },
        "operatingSystem": "Web"
      },
      {
        "@type": "WebPage",
        "name": seoTitle,
        "description": seoDescription,
        "url": `https://snapbrand.io/logo-generator/${slug}`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://snapbrand.io" },
            { "@type": "ListItem", "position": 2, "name": "Logo Generator", "item": "https://snapbrand.io/logo-generator" },
            { "@type": "ListItem", "position": 3, "name": seoTitle }
          ]
        }
      }
    ]
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const conceptsData = JSON.parse(fs.readFileSync(CONCEPTS_FILE, "utf8"));
  const concepts = conceptsData.concepts as Array<{
    slug: string; label: string; keyword: string;
    related_slugs: string[]; priority: number; status: string;
  }>;

  let pending = concepts.filter((c) => c.status === "pending");
  if (SLUG_FILTER) pending = pending.filter((c) => c.slug === SLUG_FILTER);
  pending = pending.sort((a, b) => b.priority - a.priority).slice(0, MAX);

  if (pending.length === 0) {
    console.log("No pending concepts to process.");
    return;
  }

  console.log(`Processing ${pending.length} concept(s): ${pending.map((c) => c.slug).join(", ")}`);

  if (DRY_RUN) {
    console.log("[DRY RUN] Would generate:", pending.map((c) => c.slug));
    return;
  }

  const apiKey = loadEnvKey();
  if (!apiKey) {
    console.error("OPENAI_API_KEY not found. Set it in env or snapbrand/.env.local");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const batchFile = path.join(OUTPUT_DIR, `snapbrand-batch-${timestamp}.json`);
  const results: unknown[] = [];

  for (const concept of pending) {
    console.log(`  Generating: ${concept.slug}...`);
    try {
      const prompt = buildPrompt(concept);
      const raw = await callOpenAI(prompt, apiKey);
      const generated = JSON.parse(raw);

      const entry = {
        slug: concept.slug,
        ...generated,
        schema_jsonld: buildSchema(concept.slug, generated.seoTitle, generated.seoDescription),
        _meta: {
          generated_at: new Date().toISOString(),
          source: "snapbrand-generator",
          review_status: "pending",
        },
      };

      results.push(entry);
      console.log(`    ✓ ${concept.slug} — title: "${generated.seoTitle}"`);

      // Rate limit
      await new Promise((r) => setTimeout(r, 1200));
    } catch (err) {
      console.error(`    ✗ Failed ${concept.slug}:`, err);
    }
  }

  if (results.length > 0) {
    fs.writeFileSync(batchFile, JSON.stringify(results, null, 2));
    console.log(`\n✓ Wrote ${results.length} entries to: ${batchFile}`);
    console.log("\nNext step: Review the file above, then copy approved entries into:");
    console.log("  ~/projects/snapbrand/app/logo-generator/[business-type]/config.ts");
    console.log("\nOr run the merge script:");
    console.log(`  npx tsx generators/snapbrand-merge.ts --file ${batchFile}`);
  }
}

main().catch(console.error);
