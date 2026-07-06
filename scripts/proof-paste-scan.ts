/**
 * Local CardSnap scan for Reddit proof-paste (no API rate limits).
 * Usage: node --import tsx scripts/proof-paste-scan.ts "card search" ["Near Mint"]
 */
import dotenv from "dotenv";
import path from "path";
import {
  applyCardMatchWarnings,
  parseCardIdentity,
  validateCardPricing,
} from "../lib/card-identity";
import { analyzeCardWithOpenAI } from "../lib/openai";
import { searchEbayItemPrices } from "../lib/ebay";
import { fetchPsaPopulation } from "../lib/psa";
import { mergeScanResults } from "../lib/merge-scan";
import {
  assessCommunityPasteReadiness,
  formatPasteVerdict,
} from "../lib/paste-verdict";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

async function main() {
  const cardName = process.argv[2];
  const condition = process.argv[3] ?? "Near Mint";
  if (!cardName) {
    console.error("Usage: proof-paste-scan.ts \"card search\" [condition]");
    process.exit(1);
  }

  const identity = parseCardIdentity(cardName);
  const ai = await analyzeCardWithOpenAI(cardName, condition, identity);
  const ebay = await searchEbayItemPrices(identity.ebayQuery || cardName);
  const psa = await fetchPsaPopulation(ai.confirmedName || cardName);
  let payload = mergeScanResults(ai, ebay, psa);
  try {
    payload = applyCardMatchWarnings(
      payload,
      validateCardPricing(cardName, payload, ebay.avgSoldPrice ?? null)
    );
  } catch (err) {
    console.warn("[proof-paste-scan] card match validation skipped:", err);
  }
  const readiness = assessCommunityPasteReadiness(payload);
  const paste = formatPasteVerdict(payload);

  console.log(
    JSON.stringify(
      {
        cardName,
        readiness,
        paste,
        payload,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
