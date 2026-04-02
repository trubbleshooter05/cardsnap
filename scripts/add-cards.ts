/**
 * Append new card entries to data/cards.json from a QUEUE.
 * Run: npx tsx scripts/add-cards.ts
 *
 * Edit QUEUE below, then run. Skips slugs that already exist.
 */

import fs from "fs/promises";
import path from "path";
import type { CardPage } from "../lib/cards";

type QueueEntry = Omit<
  CardPage,
  "createdAt" | "updatedAt" | "content"
> & { content?: string };

/** Add new targets here */
const QUEUE: QueueEntry[] = [
  // Example (uncomment and edit to add):
  // {
  //   slug: "example-player-2024-brand-1-value",
  //   playerName: "Example Player",
  //   year: 2024,
  //   brand: "Brand",
  //   setName: "Set",
  //   cardNumber: "1",
  //   title: "2024 Brand Set Example Player #1",
  //   metaTitle: "Example Player 2024 Brand Set #1 Value | PSA 10, PSA 9 & Raw Prices",
  //   metaDescription: "Short SEO description for the card page.",
  //   rawValueLow: 10,
  //   rawValueHigh: 50,
  //   psa9Value: 80,
  //   psa10Value: 200,
  //   popCount: 500,
  //   gradingVerdict: "skip_grading",
  //   sport: "baseball",
  //   relatedSlugs: [],
  // },
];

function slugifyPart(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Optional helper: build slug from parts */
export function buildSlug(
  player: string,
  year: number,
  brand: string,
  cardNumber: string
): string {
  return `${slugifyPart(player)}-${year}-${slugifyPart(brand)}-${slugifyPart(cardNumber)}-value`;
}

async function main() {
  if (QUEUE.length === 0) {
    console.log("QUEUE is empty. Edit scripts/add-cards.ts and add entries.");
    return;
  }

  const jsonPath = path.join(process.cwd(), "data/cards.json");
  const raw = await fs.readFile(jsonPath, "utf-8");
  const existing = JSON.parse(raw) as CardPage[];
  const seen = new Set(existing.map((c) => c.slug));

  const now = new Date().toISOString();
  let added = 0;

  for (const row of QUEUE) {
    if (seen.has(row.slug)) {
      console.log("Skip (exists):", row.slug);
      continue;
    }
    const full: CardPage = {
      ...row,
      content: row.content ?? "",
      createdAt: now,
      updatedAt: now,
    };
    existing.push(full);
    seen.add(row.slug);
    added++;
    console.log("Queued add:", full.slug);
  }

  if (added === 0) {
    console.log("No new cards added.");
    return;
  }

  await fs.writeFile(jsonPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
  console.log(`Added ${added} card(s). Rebuild the app to pick up new routes.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
