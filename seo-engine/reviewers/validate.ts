#!/usr/bin/env npx tsx
/**
 * Validation — checks generated output files for quality and completeness.
 * Run before approving any batch for merge.
 *
 * Usage:
 *   npx tsx reviewers/validate.ts --file outputs/snapbrand/snapbrand-batch-2026-04-07.json
 *   npx tsx reviewers/validate.ts --dir outputs/snapbrand
 *   npx tsx reviewers/validate.ts --dir outputs/cardsnap
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const args = process.argv.slice(2);
const FILE = args.includes("--file") ? args[args.indexOf("--file") + 1] : null;
const DIR = args.includes("--dir") ? args[args.indexOf("--dir") + 1] : null;

interface ValidationResult {
  file: string;
  entry: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── SnapBrand validators ──────────────────────────────────────────────────────
function validateSnapBrandEntry(entry: Record<string, unknown>, slug: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!entry.slug) errors.push("Missing slug");
  if (!entry.keyword) errors.push("Missing keyword");

  const seoTitle = entry.seoTitle as string;
  if (!seoTitle) errors.push("Missing seoTitle");
  else if (seoTitle.length > 65) errors.push(`seoTitle too long: ${seoTitle.length} chars (max 65)`);
  else if (seoTitle.length < 30) warnings.push(`seoTitle may be too short: ${seoTitle.length} chars`);

  const seoDesc = entry.seoDescription as string;
  if (!seoDesc) errors.push("Missing seoDescription");
  else if (seoDesc.length > 160) errors.push(`seoDescription too long: ${seoDesc.length} chars (max 160)`);
  else if (seoDesc.length < 100) warnings.push(`seoDescription short: ${seoDesc.length} chars`);

  const benefits = entry.benefits as unknown[];
  if (!benefits || !Array.isArray(benefits)) errors.push("Missing benefits array");
  else if (benefits.length < 3) errors.push(`Too few benefits: ${benefits.length} (need 3+)`);
  else {
    benefits.forEach((b, i) => {
      const bObj = b as { icon?: string; title?: string; desc?: string };
      if (!bObj.title) errors.push(`benefit[${i}] missing title`);
      if (!bObj.desc) errors.push(`benefit[${i}] missing desc`);
    });
  }

  const faqs = entry.faqItems as unknown[];
  if (!faqs || !Array.isArray(faqs)) errors.push("Missing faqItems array");
  else if (faqs.length < 3) errors.push(`Too few FAQs: ${faqs.length} (need 3+)`);

  const relatedTypes = entry.relatedTypes as unknown[];
  if (!relatedTypes || !Array.isArray(relatedTypes)) errors.push("Missing relatedTypes");
  else if (relatedTypes.length < 2) warnings.push("Only 1 related type — consider adding more");

  // Check for generic content
  const desc = (entry.description as string) ?? "";
  if (desc.toLowerCase().includes("business") && !desc.toLowerCase().includes(slug.replace(/-/g, " "))) {
    warnings.push("Description may be generic — doesn't mention the specific business type");
  }

  if (entry.schema_jsonld === undefined) warnings.push("Missing schema_jsonld — add before publishing");

  return { file: "", entry: slug, valid: errors.length === 0, errors, warnings };
}

// ── CardSnap validators ───────────────────────────────────────────────────────
function validateCardSnapGradeOrSkip(entry: Record<string, unknown>, slug: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!entry.sport) errors.push("Missing sport");
  if (!entry.h1) errors.push("Missing h1");

  const seoTitle = entry.seoTitle as string;
  if (!seoTitle) errors.push("Missing seoTitle");
  else if (seoTitle.length > 70) errors.push(`seoTitle too long: ${seoTitle.length}`);

  const gradingLogic = entry.gradingLogic as unknown[];
  if (!gradingLogic || gradingLogic.length < 4) errors.push("gradingLogic needs 4+ entries");

  const roiExamples = entry.roiExamples as Array<{
    cardName: string; rawValue: number; psa9Value: number; psa10Value: number;
    gradingCost: number; psa9Roi: number; psa10Roi: number; verdict: string;
  }>;
  if (!roiExamples || roiExamples.length < 2) errors.push("Need at least 2 ROI examples");
  else {
    roiExamples.forEach((ex, i) => {
      if (!ex.cardName) errors.push(`roiExamples[${i}] missing cardName`);
      if (!["strong", "moderate", "skip"].includes(ex.verdict)) {
        errors.push(`roiExamples[${i}] invalid verdict: ${ex.verdict}`);
      }
      // Verify ROI math
      const expectedPsa9Roi = ex.psa9Value - ex.rawValue - ex.gradingCost;
      if (Math.abs(ex.psa9Roi - expectedPsa9Roi) > 10) {
        warnings.push(`roiExamples[${i}] psa9Roi math may be off: got ${ex.psa9Roi}, expected ~${expectedPsa9Roi}`);
      }
    });
  }

  return { file: "", entry: slug, valid: errors.length === 0, errors, warnings };
}

// ── FursBliss validators ──────────────────────────────────────────────────────
function validateFursBlissEntry(entry: Record<string, unknown>, slug: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!entry.type) errors.push("Missing type");
  if (!entry.title) errors.push("Missing title");
  if (!entry.h1) errors.push("Missing h1");

  const metaTitle = entry.metaTitle as string;
  if (!metaTitle) errors.push("Missing metaTitle");
  else if (metaTitle.length > 65) errors.push(`metaTitle too long: ${metaTitle.length}`);

  const metaDesc = entry.metaDescription as string;
  if (!metaDesc) errors.push("Missing metaDescription");
  else if (metaDesc.length > 160) errors.push(`metaDescription too long: ${metaDesc.length}`);

  const sections = entry.sections as unknown[];
  if (!sections || sections.length < 2) errors.push("Need at least 2 sections");

  const meta = entry._meta as { requires_vet_review?: boolean };
  const type = entry.type as string;

  // Medical safety checks
  if (["symptom", "supplement"].includes(type) && meta?.requires_vet_review) {
    if (!entry.disclaimer) {
      errors.push("MEDICAL CONTENT requires disclaimer field");
    }
    if (meta.requires_vet_review !== true) {
      errors.push("requires_vet_review must be true for medical content");
    }
  }

  // Check for dangerous content patterns
  const contentStr = JSON.stringify(entry).toLowerCase();
  const dangerousTerms = ["cure", "treat", "diagnose", "prescribe", "medication dose", "inject"];
  dangerousTerms.forEach((term) => {
    if (contentStr.includes(term) && !contentStr.includes(`not ${term}`) && !contentStr.includes(`cannot ${term}`)) {
      warnings.push(`Content may contain potentially problematic term: "${term}" — review carefully`);
    }
  });

  const internal = entry.internal_links as unknown[];
  if (!internal || internal.length === 0) warnings.push("No internal links — add for better link equity");

  return { file: "", entry: slug, valid: errors.length === 0, errors, warnings };
}

// ── File detection ────────────────────────────────────────────────────────────
function detectType(filename: string): "snapbrand" | "cardsnap-grade" | "cardsnap-card" | "fursbliss" | "unknown" {
  if (filename.includes("snapbrand")) return "snapbrand";
  if (filename.includes("grade-or-skip")) return "cardsnap-grade";
  if (filename.includes("card-entries")) return "cardsnap-card";
  if (filename.includes("fursbliss")) return "fursbliss";
  return "unknown";
}

function validateFile(filePath: string): ValidationResult[] {
  const filename = path.basename(filePath);
  const type = detectType(filename);
  const entries = JSON.parse(fs.readFileSync(filePath, "utf8")) as Array<Record<string, unknown>>;

  if (!Array.isArray(entries)) {
    return [{ file: filename, entry: "root", valid: false, errors: ["File is not an array of entries"], warnings: [] }];
  }

  return entries.map((entry) => {
    const slug = (entry.slug as string) ?? "unknown";
    let result: ValidationResult;
    switch (type) {
      case "snapbrand": result = validateSnapBrandEntry(entry, slug); break;
      case "cardsnap-grade": result = validateCardSnapGradeOrSkip(entry, slug); break;
      case "fursbliss": result = validateFursBlissEntry(entry, slug); break;
      default:
        result = { file: filename, entry: slug, valid: true, errors: [], warnings: ["Unknown file type — manual review recommended"] };
    }
    result.file = filename;
    return result;
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  let files: string[] = [];

  if (FILE) {
    files = [path.resolve(FILE)];
  } else if (DIR) {
    const dirPath = path.resolve(DIR);
    files = fs.readdirSync(dirPath)
      .filter((f) => f.endsWith(".json"))
      .map((f) => path.join(dirPath, f));
  } else {
    // Default: check all output dirs
    const outputBase = path.join(ROOT, "outputs");
    for (const site of ["snapbrand", "cardsnap", "fursbliss"]) {
      const siteDir = path.join(outputBase, site);
      if (fs.existsSync(siteDir)) {
        files.push(
          ...fs.readdirSync(siteDir)
            .filter((f) => f.endsWith(".json"))
            .map((f) => path.join(siteDir, f))
        );
      }
    }
  }

  if (files.length === 0) {
    console.log("No output files found to validate.");
    return;
  }

  let totalValid = 0;
  let totalInvalid = 0;
  let totalWarnings = 0;

  for (const file of files) {
    const results = validateFile(file);
    console.log(`\n📄 ${path.basename(file)} (${results.length} entries)`);

    for (const r of results) {
      if (r.valid && r.warnings.length === 0) {
        console.log(`  ✅ ${r.entry}`);
        totalValid++;
      } else if (r.valid) {
        console.log(`  ⚠️  ${r.entry} — ${r.warnings.length} warning(s):`);
        r.warnings.forEach((w) => console.log(`       • ${w}`));
        totalValid++;
        totalWarnings += r.warnings.length;
      } else {
        console.log(`  ❌ ${r.entry} — ${r.errors.length} error(s):`);
        r.errors.forEach((e) => console.log(`       • ${e}`));
        if (r.warnings.length > 0) {
          r.warnings.forEach((w) => console.log(`       ⚠ ${w}`));
        }
        totalInvalid++;
      }
    }
  }

  console.log(`\n─────────────────────────────`);
  console.log(`Valid: ${totalValid} | Invalid: ${totalInvalid} | Warnings: ${totalWarnings}`);
  if (totalInvalid > 0) {
    console.log("\n❌ Fix errors before merging to production configs.");
    process.exit(1);
  } else {
    console.log("\n✅ All entries pass validation. Ready for human review and merge.");
  }
}

main();
