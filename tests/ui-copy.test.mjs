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

  assert.match(result, /How this estimate was calculated/);
  assert.match(result, /Source type/);
  assert.match(result, /Confidence level/);
  assert.match(result, /eBay live comps are not configured/);
  assert.match(email, /useState\(false\)/);
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
