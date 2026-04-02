/**
 * Fills empty `content` fields in data/cards.json using OpenAI (gpt-4o-mini).
 *
 * Usage: npx tsx scripts/generate-card-content.ts
 * Requires: OPENAI_API_KEY in .env.local
 */

import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";
import OpenAI from "openai";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

type CardJson = {
  slug: string;
  playerName: string;
  year: number;
  brand: string;
  setName: string;
  cardNumber: string;
  title: string;
  content: string;
  rawValueLow: number;
  rawValueHigh: number;
  psa9Value: number;
  psa10Value: number;
  popCount: number;
  gradingVerdict: string;
  sport: string;
  relatedSlugs: string[];
  createdAt: string;
  updatedAt: string;
};

async function main() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
  }

  const jsonPath = path.join(process.cwd(), "data/cards.json");
  const raw = await fs.readFile(jsonPath, "utf-8");
  const cards = JSON.parse(raw) as CardJson[];

  const pending = cards.filter((c) => !c.content?.trim());
  if (pending.length === 0) {
    console.log("No empty content fields. Nothing to do.");
    return;
  }

  const client = new OpenAI({ apiKey: key });

  for (const card of pending) {
    console.log("Generating:", card.slug);
    const prompt = `You are a sports card market writer. Write a comprehensive HTML article (1500–2000 words) about this trading card:

Title: ${card.title}
Player: ${card.playerName}
Year: ${card.year}, Brand: ${card.brand}, Set: ${card.setName}, Card #${card.cardNumber}

Reference values (USD, illustrative): Raw approximately ${card.rawValueLow}–${card.rawValueHigh}, PSA 9 ~${card.psa9Value}, PSA 10 ~${card.psa10Value}, estimated pop ~${card.popCount}. Grading verdict for this writeup: ${card.gradingVerdict === "worth_grading" ? "generally worth grading if condition is strong" : "often not worth grading unless gem-quality"}.

Cover in order:
1. Card history and hobby significance
2. Current market values by grade (discuss raw, PSA 8, 9, 10 where relevant)
3. Population / scarcity context
4. Is it worth grading? ROI vs typical PSA fees (mention rough fee tiers without claiming to be legal advice)
5. What to look for when buying raw (centering, surface, edges)
6. Brief mention of related collecting angles

Output ONLY valid HTML fragment suitable for embedding (use <h2>, <h3>, <p>, <ul><li>). No markdown, no <html> wrapper, no script tags.`;

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You output only clean HTML fragments for editorial use. No markdown.",
        },
        { role: "user", content: prompt },
      ],
    });

    const html = res.choices[0]?.message?.content?.trim();
    if (!html) {
      console.error("Empty response for", card.slug);
      continue;
    }

    const idx = cards.findIndex((c) => c.slug === card.slug);
    if (idx === -1) continue;
    cards[idx].content = html;
    cards[idx].updatedAt = new Date().toISOString();

    await fs.writeFile(jsonPath, JSON.stringify(cards, null, 2) + "\n", "utf-8");
    console.log("Saved:", card.slug);
  }

  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
