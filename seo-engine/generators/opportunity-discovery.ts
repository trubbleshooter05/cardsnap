#!/usr/bin/env npx tsx
/**
 * Opportunity Discovery
 * Scans existing site configs and concepts to produce a normalized
 * opportunity pipeline — opportunities/discovered-TIMESTAMP.json
 *
 * Sources:
 *  1. Concepts not yet live → converts to opportunities
 *  2. CardSnap cards.json → finds missing related slugs
 *  3. FursBliss breed-pages → finds gaps vs concept list
 *  4. SnapBrand config.ts → finds what's live vs pending
 *  5. WatchThis backlog.json → imports top-priority movie gaps
 *
 * Usage:
 *   npx tsx generators/opportunity-discovery.ts
 *   npx tsx generators/opportunity-discovery.ts --site snapbrand
 *   npx tsx generators/opportunity-discovery.ts --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const SITE_FILTER = args.includes("--site") ? args[args.indexOf("--site") + 1] : null;

const HERMES_BASE = process.env.HERMES_BASE ?? path.join(ROOT, "..", "..");

type SiteId = "snapbrand" | "cardsnap" | "movieslike" | "fursbliss";

interface Opportunity {
  id: string;
  site: SiteId;
  category: string;
  keyword: string;
  secondary_keywords: string[];
  search_intent: "informational" | "transactional" | "commercial_investigation";
  page_type: string;
  url_path: string;
  priority_score: number;
  estimated_monthly_searches: number | null;
  source: string;
  publish_status: "idea";
  distribution_status: "not_started";
  created_at: string;
  notes: string;
  safe_to_automate: boolean;
}

function makeId(site: string, slug: string): string {
  return `${site}-${slug}`.replace(/[^a-z0-9-]/g, "-");
}

// ── SnapBrand discovery ───────────────────────────────────────────────────────
function discoverSnapBrand(): Opportunity[] {
  const ops: Opportunity[] = [];
  const conceptsPath = path.join(ROOT, "concepts", "snapbrand-concepts.json");
  const data = JSON.parse(fs.readFileSync(conceptsPath, "utf8"));

  const liveSlugs = new Set([
    ...(data._live as string[]),
    ...(data._generated_pending_review as string[]),
  ]);

  for (const c of data.concepts) {
    if (liveSlugs.has(c.slug)) continue;
    if (c.status === "live") continue;

    ops.push({
      id: makeId("snapbrand", c.slug),
      site: "snapbrand",
      category: "logo-generator",
      keyword: c.keyword,
      secondary_keywords: [`${c.label} logo maker`, `${c.label} logo design`, `AI logo generator ${c.label}`],
      search_intent: "transactional",
      page_type: "tool_lander",
      url_path: `/logo-generator/${c.slug}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: c.monthly_searches_est,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `Related: ${c.related_slugs.join(", ")}`,
      safe_to_automate: true,
    });
  }

  return ops;
}

// ── CardSnap discovery ────────────────────────────────────────────────────────
function discoverCardSnap(): Opportunity[] {
  const ops: Opportunity[] = [];
  const conceptsPath = path.join(ROOT, "concepts", "cardsnap-concepts.json");
  const data = JSON.parse(fs.readFileSync(conceptsPath, "utf8"));

  // Grade-or-skip gaps
  const liveSlugs = new Set(data._live_grade_or_skip as string[]);
  for (const c of data.grade_or_skip_concepts) {
    if (liveSlugs.has(c.slug)) continue;
    ops.push({
      id: makeId("cardsnap", `grade-or-skip-${c.slug}`),
      site: "cardsnap",
      category: "grade-or-skip",
      keyword: c.keyword,
      secondary_keywords: [`${c.sport} card grading worth it`, `should i grade ${c.sport} cards psa`, `${c.sport} card grading ROI`],
      search_intent: "commercial_investigation",
      page_type: "grade_or_skip",
      url_path: `/grade-or-skip/${c.slug}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: c.monthly_searches_est,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `${c.sport} cards grade-or-skip guide`,
      safe_to_automate: true,
    });
  }

  // Card entry gaps — check which are not yet in data/cards.json
  const cardsJsonPath = path.join(HERMES_BASE, "cardsnap", "data", "cards.json");
  let existingSlugs = new Set<string>();
  if (fs.existsSync(cardsJsonPath)) {
    const cards = JSON.parse(fs.readFileSync(cardsJsonPath, "utf8")) as { slug: string }[];
    existingSlugs = new Set(cards.map((c) => c.slug));
  }

  for (const c of data.card_entry_concepts) {
    const slugBase = `${c.player.toLowerCase().replace(/\s+/g, "-")}-${c.year}-${c.brand.toLowerCase().replace(/\s+/g, "-")}-value`;
    if (existingSlugs.has(slugBase)) continue;
    ops.push({
      id: makeId("cardsnap", slugBase),
      site: "cardsnap",
      category: "card-detail",
      keyword: `${c.player} ${c.year} ${c.brand} value`,
      secondary_keywords: [`${c.player} ${c.year} ${c.brand} PSA 10`, `${c.player} ${c.year} ${c.brand} price`],
      search_intent: "commercial_investigation",
      page_type: "programmatic",
      url_path: `/cards/${slugBase}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: null,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `${c.player} ${c.year} ${c.brand} — ${c.sport}`,
      safe_to_automate: true,
    });
  }

  return ops;
}

// ── FursBliss discovery ───────────────────────────────────────────────────────
function discoverFursBliss(): Opportunity[] {
  const ops: Opportunity[] = [];
  const conceptsPath = path.join(ROOT, "concepts", "fursbliss-concepts.json");
  const data = JSON.parse(fs.readFileSync(conceptsPath, "utf8"));

  // Check existing breed-pages
  const breedPagesPath = path.join(HERMES_BASE, "fursbliss", "lib", "breed-pages.ts");
  let existingBreedSlugs = new Set<string>();
  if (fs.existsSync(breedPagesPath)) {
    const raw = fs.readFileSync(breedPagesPath, "utf8");
    const matches = raw.matchAll(/slug:\s*["']([^"']+)["']/g);
    for (const m of matches) existingBreedSlugs.add(m[1]);
  }

  for (const c of data.breed_concepts) {
    if (existingBreedSlugs.has(c.slug)) continue;
    ops.push({
      id: makeId("fursbliss", `breed-${c.slug}`),
      site: "fursbliss",
      category: "breed",
      keyword: c.keyword,
      secondary_keywords: [`${c.slug.replace(/-/g, " ")} lifespan`, `${c.slug.replace(/-/g, " ")} health problems`],
      search_intent: "informational",
      page_type: "guide",
      url_path: `/breeds/${c.slug}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: null,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `Breed guide — requires_medical_review: ${c.requires_medical_review}`,
      safe_to_automate: !c.requires_medical_review,
    });
  }

  for (const c of data.supplement_concepts) {
    ops.push({
      id: makeId("fursbliss", `supplement-${c.slug}`),
      site: "fursbliss",
      category: "supplement",
      keyword: c.keyword,
      secondary_keywords: [`${c.slug.replace(/-/g, " ")} dogs side effects`, `best ${c.slug.replace(/-/g, " ")} dogs`],
      search_intent: "informational",
      page_type: "guide",
      url_path: `/supplements/${c.slug}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: null,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `Supplement guide — requires_medical_review: ${c.requires_medical_review}`,
      safe_to_automate: !c.requires_medical_review,
    });
  }

  for (const c of data.glossary_concepts) {
    ops.push({
      id: makeId("fursbliss", `glossary-${c.slug}`),
      site: "fursbliss",
      category: "glossary",
      keyword: c.keyword,
      secondary_keywords: [],
      search_intent: "informational",
      page_type: "glossary",
      url_path: `/glossary/${c.slug}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: null,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `Cluster: ${c.cluster}`,
      safe_to_automate: !c.requires_medical_review,
    });
  }

  for (const c of data.symptom_reference_concepts) {
    ops.push({
      id: makeId("fursbliss", `symptom-${c.slug}`),
      site: "fursbliss",
      category: "symptom",
      keyword: c.keyword,
      secondary_keywords: [],
      search_intent: "informational",
      page_type: "guide",
      url_path: `/symptoms/${c.slug}`,
      priority_score: c.priority * 2,
      estimated_monthly_searches: null,
      source: "concept_list",
      publish_status: "idea",
      distribution_status: "not_started",
      created_at: new Date().toISOString(),
      notes: `MEDICAL CONTENT — requires vet review before publishing. ${c.safety_note ?? ""}`,
      safe_to_automate: false,
    });
  }

  return ops;
}

// ── WatchThis ─────────────────────────────────────────────────────────────────
function discoverMoviesLike(): Opportunity[] {
  // WatchThis has its own discovery pipeline (gsc-movieslike-sync.mjs)
  // This function just reads the backlog to import top items as opportunities
  const backlogPath = path.join(HERMES_BASE, "watchthisapp", "scripts", "backlog.json");
  if (!fs.existsSync(backlogPath)) return [];

  const backlog = JSON.parse(fs.readFileSync(backlogPath, "utf8")) as Array<{ slug: string; title?: string }>;
  const top = backlog.slice(0, 10);

  return top.map((item) => ({
    id: makeId("movieslike", item.slug),
    site: "movieslike" as SiteId,
    category: "movies-like",
    keyword: `movies like ${item.title ?? item.slug.replace(/-/g, " ")}`,
    secondary_keywords: [`films similar to ${item.title ?? item.slug}`, `${item.title ?? item.slug} recommendations`],
    search_intent: "informational" as const,
    page_type: "programmatic",
    url_path: `/movies-like/${item.slug}`,
    priority_score: 6,
    estimated_monthly_searches: null,
    source: "backlog_import",
    publish_status: "idea" as const,
    distribution_status: "not_started" as const,
    created_at: new Date().toISOString(),
    notes: "Auto-managed by WatchThis forge pipeline",
    safe_to_automate: true,
  }));
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  let opportunities: Opportunity[] = [];

  if (!SITE_FILTER || SITE_FILTER === "snapbrand") opportunities.push(...discoverSnapBrand());
  if (!SITE_FILTER || SITE_FILTER === "cardsnap") opportunities.push(...discoverCardSnap());
  if (!SITE_FILTER || SITE_FILTER === "fursbliss") opportunities.push(...discoverFursBliss());
  if (!SITE_FILTER || SITE_FILTER === "movieslike") opportunities.push(...discoverMoviesLike());

  // Sort by priority
  opportunities.sort((a, b) => b.priority_score - a.priority_score);

  console.log(`\nDiscovered ${opportunities.length} opportunities:`);
  const bySite: Record<string, number> = {};
  for (const op of opportunities) {
    bySite[op.site] = (bySite[op.site] ?? 0) + 1;
  }
  Object.entries(bySite).forEach(([site, count]) => console.log(`  ${site}: ${count}`));

  const manualReviewCount = opportunities.filter((o) => !o.safe_to_automate).length;
  console.log(`\n⚠️  ${manualReviewCount} require manual review before publish (medical/sensitive)`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Top 10 by priority:");
    opportunities.slice(0, 10).forEach((o) =>
      console.log(`  [${o.priority_score}] ${o.site} ${o.url_path} — ${o.keyword}`)
    );
    return;
  }

  const opDir = path.join(ROOT, "opportunities");
  fs.mkdirSync(opDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const out = path.join(opDir, `discovered-${ts}.json`);
  fs.writeFileSync(out, JSON.stringify(opportunities, null, 2));
  console.log(`\n✓ Wrote to: ${out}`);
}

main().catch(console.error);
