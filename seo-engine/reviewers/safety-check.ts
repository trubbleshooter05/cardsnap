#!/usr/bin/env npx tsx
/**
 * Safety Checker — specific to FursBliss medical content.
 * Scans generated content for patterns that could be harmful or misleading.
 *
 * Usage:
 *   npx tsx reviewers/safety-check.ts --file outputs/fursbliss/fursbliss-symptom-*.json
 */

import * as fs from "node:fs";
import * as path from "node:path";

const args = process.argv.slice(2);
const FILE = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;

// Patterns that are NEVER acceptable in medical content
const HARD_FAILS = [
  { pattern: /give your dog \d+ mg/i, reason: "Specific medication dosing — must not prescribe" },
  { pattern: /dose of \d+\s?mg/i, reason: "Specific medication dosing" },
  { pattern: /this (means|indicates|confirms) your dog has/i, reason: "Diagnostic claim" },
  { pattern: /you can (treat|cure) this at home/i, reason: "Claiming home treatment" },
  { pattern: /no need to (see|visit) (a |your )?vet/i, reason: "Discouraging vet visits" },
  { pattern: /definitely (has|is suffering from)/i, reason: "Certainty language in medical context" },
];

// Patterns that require a warning
const SOFT_WARNS = [
  { pattern: /can treat/i, reason: "'can treat' — rephrase to 'may help manage'" },
  { pattern: /will cure/i, reason: "'will cure' — no cure claims" },
  { pattern: /guaranteed/i, reason: "'guaranteed' — remove certainty language" },
  { pattern: /always works/i, reason: "'always works' — remove certainty language" },
  { pattern: /safe for all dogs/i, reason: "'safe for all dogs' — no blanket safety claims" },
  { pattern: /without consulting/i, reason: "Suggests skipping vet consultation" },
];

const REQUIRED_DISCLAIMER_FRAGMENT = "not a substitute for professional veterinary";

interface SafetyResult {
  file: string;
  slug: string;
  passed: boolean;
  hard_fails: string[];
  soft_warns: string[];
  has_disclaimer: boolean;
}

function checkEntry(entry: Record<string, unknown>, filename: string): SafetyResult {
  const slug = (entry.slug as string) ?? "unknown";
  const contentStr = JSON.stringify(entry);

  const hardFails: string[] = [];
  const softWarns: string[] = [];

  for (const check of HARD_FAILS) {
    if (check.pattern.test(contentStr)) hardFails.push(check.reason);
  }
  for (const check of SOFT_WARNS) {
    if (check.pattern.test(contentStr)) softWarns.push(check.reason);
  }

  const hasDisclaimer = contentStr.toLowerCase().includes(REQUIRED_DISCLAIMER_FRAGMENT);

  // Medical types MUST have disclaimer
  const type = entry.type as string;
  const meta = entry._meta as { requires_vet_review?: boolean } | undefined;
  if ((type === "symptom" || meta?.requires_vet_review) && !hasDisclaimer) {
    hardFails.push("Missing required medical disclaimer");
  }

  return {
    file: filename,
    slug,
    passed: hardFails.length === 0,
    hard_fails: hardFails,
    soft_warns: softWarns,
    has_disclaimer: hasDisclaimer,
  };
}

function main() {
  if (!FILE) {
    console.log("Usage: npx tsx reviewers/safety-check.ts --file <path>");
    process.exit(1);
  }

  const filePath = path.resolve(FILE);
  const filename = path.basename(filePath);
  const entries = JSON.parse(fs.readFileSync(filePath, "utf8")) as Array<Record<string, unknown>>;

  if (!Array.isArray(entries)) {
    console.error("File must contain a JSON array of entries.");
    process.exit(1);
  }

  const results = entries.map((e) => checkEntry(e, filename));

  let allPassed = true;
  for (const r of results) {
    if (r.hard_fails.length > 0) {
      allPassed = false;
      console.log(`\n🚫 FAIL — ${r.slug}`);
      r.hard_fails.forEach((f) => console.log(`   ❌ ${f}`));
    } else if (r.soft_warns.length > 0) {
      console.log(`\n⚠️  WARN — ${r.slug}`);
      r.soft_warns.forEach((w) => console.log(`   ⚠ ${w}`));
      if (!r.has_disclaimer) console.log(`   ⚠ Missing disclaimer`);
    } else {
      console.log(`\n✅ PASS — ${r.slug}`);
    }
  }

  console.log("\n────────────────────────────");
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Passed: ${passed} | Failed: ${failed}`);

  if (!allPassed) {
    console.log("\n🚫 Do NOT publish entries with hard fails. Fix content first.");
    process.exit(1);
  }
}

main();
