import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("primary flow uses analyze language and progress messages", () => {
  const home = read("components/HomePageClient.tsx");
  const form = read("components/ScanForm.tsx");
  const nav = read("components/SiteNav.tsx");

  for (const message of [
    "Finding raw card comps",
    "Comparing PSA 9 and PSA 10 values",
    "Estimating grading fees",
    "Calculating ROI verdict",
  ]) {
    assert.match(home, new RegExp(message));
  }

  assert.match(form, /Analyze Card/);
  assert.match(nav, /Analyze/);
  assert.doesNotMatch(form, /Scan Your Card/);
  assert.doesNotMatch(home, /Analyzing your card/);
});

test("result card explains estimate source and safer email opt-in is default", () => {
  const result = read("components/ResultCard.tsx");
  const email = read("components/EmailCapture.tsx");
  const home = read("components/HomePageClient.tsx");

  assert.match(result, /How this estimate was calculated/);
  assert.match(result, /Source type/);
  assert.match(result, /Confidence level/);
  assert.match(result, /eBay live comps are not configured/);
  assert.match(email, /useState\(false\)/);
  assert.doesNotMatch(home, /Get monthly high-ROI grading picks/);
  assert.match(home, /<EmailCapture scanId=\{result\.scanId\} \/>/);
});

test("result card emphasizes upside and market movement", () => {
  const result = read("components/ResultCard.tsx");

  assert.match(result, /You could be sitting on a/);
  assert.match(result, /Raw value/);
  assert.match(result, /PSA 9/);
  assert.match(result, /PSA 10/);
  assert.match(result, /Based on recent market comps and grading outcomes/);
  assert.match(result, /Card values fluctuate/);
});

test("monetization funnel shows pricing and gives three free analyses", () => {
  const usage = read("lib/usage-limits.ts");
  const gate = read("components/ScanGate.tsx");
  const pricing = read("app/pricing/page.tsx");
  const nav = read("components/SiteNav.tsx");
  const footer = read("components/SiteFooter.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(usage, /FREE_SCAN_LIMIT = 3/);
  assert.match(gate, /\$9\/mo/);
  assert.match(gate, /\$29\/yr founding/);
  assert.match(pricing, /CardSnap Pro/);
  assert.match(pricing, /\$9/);
  assert.match(pricing, /\$29/);
  assert.match(nav, /Pricing/);
  assert.match(footer, /Pricing/);
  assert.match(sitemap, /\/pricing/);
});

test("card values hub targets value checker intent without scan wording", () => {
  const cards = read("app/cards/page.tsx");

  assert.match(cards, /Sports Card Value Checker/);
  assert.match(cards, /baseball card price checker/i);
  assert.match(cards, /football card price checker/i);
  assert.match(cards, /basketball card price checker/i);
  assert.match(cards, /sports card price history/i);
  assert.match(cards, /sports card grading calculator/i);
  assert.match(cards, /Analyze your card/);
  assert.doesNotMatch(cards, /scan your own copy/i);
  assert.doesNotMatch(cards, /Use the scanner/i);
  assert.doesNotMatch(cards, /Go to scan/i);
});

test("sports card value checker route is crawlable and funnels to analyzer", () => {
  const checker = read("app/sports-card-value-checker/page.tsx");
  const nav = read("components/SiteNav.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(checker, /Sports Card Value Checker/);
  assert.match(checker, /psa card value lookup/i);
  assert.match(checker, /sports card price tracker/i);
  assert.match(checker, /sports card price history/i);
  assert.match(checker, /should I grade my card/i);
  assert.match(checker, /baseball card price checker/i);
  assert.match(checker, /football card price checker/i);
  assert.match(checker, /basketball card price checker/i);
  assert.match(checker, /sports card grading calculator/i);
  assert.match(checker, /Analyze your card/);
  assert.match(nav, /href="\/sports-card-value-checker"/);
  assert.match(sitemap, /\/sports-card-value-checker/);
});

test("pokemon card value checker route captures crypto-to-collectibles intent", () => {
  const checker = read("app/pokemon-card-value-checker/page.tsx");
  const nav = read("components/SiteNav.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(checker, /Pokemon Card Value Checker/);
  assert.match(checker, /Pokemon cards are physical, scarce, and emotional/);
  assert.match(checker, /Before you treat Pokemon cards like an investment/);
  assert.match(checker, /pokemon card price tracker/i);
  assert.match(checker, /pokemon card price history/i);
  assert.match(checker, /pokemon card collection tracker/i);
  assert.match(checker, /charizard card value checker/i);
  assert.match(checker, /raw vs PSA 9 vs PSA 10/i);
  assert.match(checker, /Analyze your Pokemon card/);
  assert.match(nav, /href: "\/pokemon-card-value-checker"/);
  assert.match(sitemap, /\/pokemon-card-value-checker/);
});

test("pokemon support pages target charizard and price tracker wedges", () => {
  const charizard = read("app/charizard-card-value-checker/page.tsx");
  const tracker = read("app/pokemon-card-price-tracker/page.tsx");
  const pokemon = read("app/pokemon-card-value-checker/page.tsx");
  const sitemap = read("app/sitemap.ts");

  assert.match(charizard, /Charizard Card Value Checker/);
  assert.match(charizard, /charizard card value checker/i);
  assert.match(charizard, /Raw vs PSA 9 vs PSA 10/);
  assert.match(charizard, /Analyze your Charizard card/);
  assert.match(charizard, /\/pokemon-card-value-checker/);

  assert.match(tracker, /Pokemon Card Price Tracker/);
  assert.match(tracker, /pokemon card price history/i);
  assert.match(tracker, /pokemon card collection tracker/i);
  assert.match(tracker, /raw-to-graded spread/i);
  assert.match(tracker, /Analyze your Pokemon card/);
  assert.match(tracker, /\/charizard-card-value-checker/);

  assert.match(pokemon, /\/charizard-card-value-checker/);
  assert.match(pokemon, /\/pokemon-card-price-tracker/);
  assert.match(sitemap, /\/charizard-card-value-checker/);
  assert.match(sitemap, /\/pokemon-card-price-tracker/);
});
