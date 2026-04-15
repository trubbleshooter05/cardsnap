#!/usr/bin/env npx tsx
/**
 * CardSnap — high-intent grading decision keywords (25 per run)
 *
 * Focus: sports cards, Pokémon, PSA/BGS/SGC, grading submit vs hold raw.
 * No broad single-word or generic "sports cards" / bare "grading ROI" queries.
 *
 * Usage:
 *   npx tsx generators/cardsnap-keyword-generator.ts
 *   npx tsx generators/cardsnap-keyword-generator.ts --date 2026-04-15
 *   npx tsx generators/cardsnap-keyword-generator.ts --stdout   # print only, no file
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DISTRO = path.join(ROOT, "distro");

/** Mulberry32 seeded PRNG */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h) || 1;
}

function shuffle<T>(arr: T[], seedStr: string): T[] {
  const rng = mulberry32(hashSeed(seedStr));
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const YEARS = ["2020", "2021", "2022", "2023", "2024", "2025", "2026"] as const;

const SPORTS_SETS = [
  "Prizm",
  "Topps Chrome",
  "Bowman Chrome",
  "Select",
  "Mosaic",
  "National Treasures",
] as const;

const PKM_SETS = [
  "Evolving Skies",
  "Scarlet & Violet 151",
  "Obsidian Flames",
  "Paldea Evolved",
  "Crown Zenith",
] as const;

/** Build a large pool of decision-only queries; deduped */
function buildCandidatePool(): string[] {
  const q: string[] = [];

  for (const y of YEARS) {
    q.push(`should I grade my ${y} Prizm rookie PSA 10 or sell raw`);
    q.push(`is it worth grading ${y} Bowman Chrome rookie before PSA fees go up`);
    q.push(`should I submit ${y} Topps Chrome rookie to PSA or wait`);
    q.push(`raw vs PSA 10 value ${y} Select basketball rookie worth grading`);
    q.push(`PSA 9 vs PSA 10 ${y} Mosaic football rookie which should I chase`);
  }

  for (const s of SPORTS_SETS) {
    q.push(`should I grade ${s} rookie autograph PSA or BGS for resale`);
    q.push(`is ${s} base rookie worth sending to SGC vs PSA ${YEARS[4]}`);
    q.push(`what ${s} cards are worth grading PSA in ${YEARS[5]}`);
  }

  q.push(
    "should I grade modern sports cards PSA or is raw smarter after fees",
    "is PSA grading worth it for low-end rookies after 2024 fee changes",
    "should I crack a BGS 9.5 and resubmit to PSA for a 10",
    "BGS black label vs PSA 10 which holds value for modern chrome rookies",
    "SGC 10 vs PSA 10 resale on basketball rookies worth the crossover",
    "should I grade a damaged corner card PSA 8 or sell raw",
    "is it worth grading vintage Topps baseball PSA vs SGC for cost",
    "raw vs PSA 10 ROI on 2024 football Prizm color rookies",
    "should I grade patch auto /99 National Treasures or move raw",
    "PSA bulk turnaround worth it for 2023 Prizm base rookies",
    "should I grade rookie cup cards Topps Chrome or skip",
    "is crossover from BGS to PSA worth fees on gold refractors",
    "what 2024 Bowman Chrome prospects are worth submitting to PSA",
    "should I grade 1st Bowman paper vs chrome for PSA flip",
    "is grading worth PSA fees on inserts under fifty dollars raw",
    "should I grade numbered /25 rookie PSA or sell ungraded",
    "PSA 10 pop report too high should I still grade this Prizm rookie",
    "should I grade for registry set or sell raw Pokémon English",
  );

  for (const y of ["2023", "2024", "2025", "2026"] as const) {
    for (const p of PKM_SETS) {
      q.push(`should I grade ${y} ${p} chase card PSA 10 or buy graded`);
      q.push(`raw vs PSA 10 Pokémon ${p} ${y} alt art worth grading`);
    }
  }

  q.push(
    "should I grade Pokémon Charizard VMAX modern or buy slabbed already",
    "is it worth grading Japanese Pokémon vs English for PSA 10",
    "should I submit vintage Pokémon Base Set Shadowless to PSA or CGC",
    "PSA 9 vs PSA 10 Pokémon trainer gallery worth the upgrade fee",
    "should I grade error miscut Pokémon card PSA for niche buyers",
    "is SGC cheaper worth it for Pokémon bulk vs PSA 10 chase",
    "should I grade Pikachu promo cards PSA or keep sealed",
    "raw vs graded value Pokémon Eeveelution alt art PSA 10 2024",
    "should I grade McDonald's promo Pokémon or skip PSA",
    "is it worth grading common Pokémon bulk for PSA 10 flips",
  );

  q.push(
    "should I grade on-card auto rookies PSA DNA vs card grade only",
    "is dual grading worth it for booklet autos National Treasures",
    "should I wait for PSA economy tier or use express for playoff rookies",
  );

  // Dedupe (case-insensitive), drop empties
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of q) {
    const k = line.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(line.trim());
  }
  return out;
}

const PER_RUN = 25;

function main(): void {
  const args = process.argv.slice(2);
  const stdoutOnly = args.includes("--stdout");
  const dateArg = args.includes("--date") ? args[args.indexOf("--date") + 1] : null;
  const seed = dateArg ?? new Date().toISOString().slice(0, 10);

  const pool = buildCandidatePool();
  if (pool.length < PER_RUN) {
    console.error(`Candidate pool too small: ${pool.length}`);
    process.exit(1);
  }

  const picked = shuffle(pool, `cardsnap-kw-${seed}`).slice(0, PER_RUN);

  const lines = [
    "# CardSnap — high-intent grading decision keywords",
    "",
    `Generated (UTC): ${new Date().toISOString()}`,
    `Run seed: ${seed}`,
    `Pool size: ${pool.length} · Emitted: ${PER_RUN}`,
    "",
    "Rules: decision queries only (grade vs not, submit vs raw, slab choice). No generic head terms.",
    "",
    ...picked.map((k, i) => `${i + 1}. ${k}`),
    "",
  ];

  const md = lines.join("\n");

  if (stdoutOnly) {
    console.log(md);
    return;
  }

  fs.mkdirSync(DISTRO, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = path.join(DISTRO, `cardsnap-intent-keywords-${ts}.md`);
  const latest = path.join(DISTRO, "cardsnap-intent-keywords-latest.md");
  fs.writeFileSync(outFile, md, "utf8");
  fs.writeFileSync(latest, md, "utf8");
  console.log(`Wrote ${outFile}`);
  console.log(`Updated ${latest}`);
}

main();
