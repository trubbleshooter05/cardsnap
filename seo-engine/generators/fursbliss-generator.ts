#!/usr/bin/env npx tsx
/**
 * FursBliss SEO Generator
 * Generates hub/authority/glossary page objects from concepts/fursbliss-concepts.json.
 * Medical safety mode: all symptom/drug content includes disclaimers and is flagged for review.
 *
 * Usage:
 *   npx tsx generators/fursbliss-generator.ts --type breed
 *   npx tsx generators/fursbliss-generator.ts --type supplement
 *   npx tsx generators/fursbliss-generator.ts --type glossary
 *   npx tsx generators/fursbliss-generator.ts --type symptom    # ALWAYS requires review
 *   npx tsx generators/fursbliss-generator.ts --slug labrador-retriever
 *   npx tsx generators/fursbliss-generator.ts --dry-run
 *   npx tsx generators/fursbliss-generator.ts --max 5
 *
 * Output:
 *   outputs/fursbliss/[type]-TIMESTAMP.json — reviewable page objects
 *
 * SAFETY: Symptom content is NEVER auto-published. All medical content flagged for human review.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CONCEPTS_FILE = path.join(ROOT, "concepts", "fursbliss-concepts.json");
const OUTPUT_DIR = path.join(ROOT, "outputs", "fursbliss");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const TYPE_FILTER = args.includes("--type") ? args[args.indexOf("--type") + 1] : null;
const SLUG_FILTER = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const MAX = args.includes("--max") ? parseInt(args[args.indexOf("--max") + 1], 10) : 5;

const MEDICAL_DISCLAIMER = `**Important:** This content is for educational purposes only and is not a substitute for professional veterinary advice. Always consult a licensed veterinarian before making health decisions for your pet. If your dog is showing concerning symptoms, contact your vet immediately.`;

function loadEnvKey(): string | null {
  const envKey = process.env.OPENAI_API_KEY?.trim();
  if (envKey) return envKey;
  const envPath = path.join(path.dirname(ROOT), "fursbliss", ".env.local");
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
      model: "gpt-4o",  // FursBliss uses gpt-4o for higher accuracy
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices[0].message.content;
}

function buildBreedPrompt(concept: { slug: string; title: string; keyword: string }): string {
  return `You are a dog health and longevity expert writing for FursBliss, a premium dog health platform focused on supplements and longevity science.

Write a breed guide page for: ${concept.title}
Slug: ${concept.slug}
Target keyword: ${concept.keyword}

Return JSON:
{
  "slug": "${concept.slug}",
  "type": "breed",
  "cluster": "breeds",
  "title": "${concept.title}",
  "metaTitle": "60-char max: ${concept.title} | FursBliss",
  "metaDescription": "155-char max: breed-specific longevity, supplement and health guide",
  "canonical": "/breeds/${concept.slug}",
  "h1": "${concept.title}",
  "summary": "2-3 sentences introducing this breed's health profile and what owners should know",
  "sections": [
    { "heading": "Breed Overview & Typical Lifespan", "content": "150-200 words on average lifespan, size, temperament" },
    { "heading": "Common Health Issues for This Breed", "content": "150-200 words on breed-specific health predispositions" },
    { "heading": "Supplement Focus for This Breed", "content": "150-200 words on which supplements benefit this breed most (omega-3, probiotics, glucosamine, etc.)" },
    { "heading": "Longevity Tips for Owners", "content": "150-200 words on diet, exercise, vet schedule, early screening" }
  ],
  "internal_links": [
    { "text": "Take the free longevity quiz", "url": "/quiz" },
    { "text": "Learn about omega-3 for dogs", "url": "/supplements/omega-3-for-dogs" },
    { "text": "Explore all dog breeds", "url": "/breeds" }
  ]
}

Rules:
- All health claims must be evidence-based or clearly framed as general guidance
- Do NOT make specific medical diagnoses or prescribe treatments
- Always recommend vet consultations for health concerns
- Return only the JSON, no extra text`;
}

function buildSupplementPrompt(concept: { slug: string; title: string; keyword: string; requires_medical_review: boolean }): string {
  const cautionNote = concept.requires_medical_review
    ? "IMPORTANT: This supplement has significant safety/dosing considerations. Be especially conservative and emphasize vet consultation prominently."
    : "";

  return `You are a pet health nutrition writer for FursBliss, focused on dog supplements and longevity science.
${cautionNote}

Write a supplement guide for: ${concept.title}
Slug: ${concept.slug}
Target keyword: ${concept.keyword}

Return JSON:
{
  "slug": "${concept.slug}",
  "type": "supplement",
  "cluster": "supplements",
  "title": "${concept.title}",
  "metaTitle": "60-char max including keyword",
  "metaDescription": "155-char max",
  "canonical": "/supplements/${concept.slug}",
  "h1": "${concept.title}",
  "summary": "2-3 sentences on what this supplement is and why dog owners search for it",
  "sections": [
    { "heading": "What Is [Supplement]?", "content": "100-150 words: what it is, source, basic mechanism" },
    { "heading": "Benefits for Dogs", "content": "150-200 words: research-backed benefits, what studies show" },
    { "heading": "Dosage Guidelines", "content": "100-150 words: general ranges by weight — MUST say 'consult your vet for your dog's specific needs'" },
    { "heading": "Safety & Potential Side Effects", "content": "100-150 words: known risks, contraindications, when to avoid" },
    { "heading": "How to Choose Quality Products", "content": "100-150 words: what to look for, certifications, forms" }
  ],
  "internal_links": [
    { "text": "View our supplement dashboard", "url": "/dashboard" },
    { "text": "Check supplement interactions", "url": "/interaction-checker" },
    { "text": "All supplements", "url": "/supplements" }
  ],
  "disclaimer": "${MEDICAL_DISCLAIMER}"
}`;
}

function buildGlossaryPrompt(concept: { slug: string; title: string; keyword: string; cluster: string }): string {
  return `You are a dog health and longevity expert writing for FursBliss.

Write an educational reference page for: ${concept.title}
Slug: ${concept.slug}
Target keyword: ${concept.keyword}
Content cluster: ${concept.cluster}

Return JSON:
{
  "slug": "${concept.slug}",
  "type": "glossary",
  "cluster": "${concept.cluster}",
  "title": "${concept.title}",
  "metaTitle": "60-char max",
  "metaDescription": "155-char max",
  "canonical": "/glossary/${concept.slug}",
  "h1": "${concept.title}",
  "summary": "2-3 sentences on what this page covers and who it helps",
  "sections": [
    { "heading": "section heading", "content": "150-200 word section" },
    { "heading": "section heading", "content": "150-200 word section" },
    { "heading": "section heading", "content": "150-200 word section" }
  ],
  "internal_links": [
    { "text": "link text", "url": "/relevant-internal-url" }
  ]
}

Return only JSON.`;
}

function buildSymptomPrompt(concept: {
  slug: string; title: string; keyword: string; safety_note?: string;
}): string {
  const safetyNote = concept.safety_note ?? "Include prominent vet disclaimer.";
  return `You are a veterinary content writer for FursBliss writing a SAFE, non-diagnostic symptom reference page.
CRITICAL SAFETY RULES:
- Do NOT diagnose conditions
- Do NOT recommend specific treatments or medications
- ALWAYS say "consult your veterinarian immediately" for serious symptoms
- List POSSIBLE CAUSES only — not definitive diagnoses
- Always include the standard disclaimer

${safetyNote}

Write a symptom reference page for: ${concept.title}
Slug: ${concept.slug}
Keyword: ${concept.keyword}

Return JSON:
{
  "slug": "${concept.slug}",
  "type": "symptom",
  "cluster": "symptoms",
  "title": "${concept.title}",
  "metaTitle": "60-char max",
  "metaDescription": "155-char max — informational only",
  "canonical": "/symptoms/${concept.slug}",
  "h1": "${concept.title}",
  "summary": "2-3 sentences — note this is informational, not a diagnosis",
  "sections": [
    { "heading": "When to See a Vet Immediately", "content": "100 words — list urgent red flags that require emergency vet visit" },
    { "heading": "Possible Causes (Not a Diagnosis)", "content": "150-200 words — common possible causes, framed as 'could indicate' not 'means'" },
    { "heading": "What to Monitor at Home", "content": "100-150 words — safe observation checklist before vet visit" },
    { "heading": "Questions Your Vet May Ask", "content": "100 words — help owners prepare for the vet visit" }
  ],
  "internal_links": [
    { "text": "Use our triage tool", "url": "/triage" },
    { "text": "ER triage for dogs", "url": "/er-triage-for-dogs" }
  ],
  "disclaimer": "${MEDICAL_DISCLAIMER}"
}`;
}

function buildSchema(type: string, slug: string, title: string, description: string, requiresMedical: boolean): Record<string, unknown> {
  const urlBase = "https://www.fursbliss.com";
  const urlPath = type === "glossary" ? `/glossary/${slug}` : `/${type}s/${slug}`;
  const schemaType = requiresMedical ? "MedicalWebPage" : "Article";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": schemaType,
        "headline": title,
        "description": description,
        "url": `${urlBase}${urlPath}`,
        "author": { "@type": "Organization", "name": "FursBliss" },
        "publisher": { "@type": "Organization", "name": "FursBliss", "url": urlBase }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": urlBase },
          { "@type": "ListItem", "position": 2, "name": type.charAt(0).toUpperCase() + type.slice(1) + "s", "item": `${urlBase}/${type}s` },
          { "@type": "ListItem", "position": 3, "name": title }
        ]
      }
    ]
  };
}

async function main() {
  const data = JSON.parse(fs.readFileSync(CONCEPTS_FILE, "utf8"));

  // Collect concepts based on type filter
  type Concept = {
    slug: string; title: string; keyword: string; type?: string; cluster?: string;
    requires_medical_review: boolean; priority: number; status: string; safety_note?: string;
  };

  let allConcepts: Concept[] = [];

  if (!TYPE_FILTER || TYPE_FILTER === "breed") {
    allConcepts.push(...data.breed_concepts.map((c: Concept) => ({ ...c, type: "breed" })));
  }
  if (!TYPE_FILTER || TYPE_FILTER === "supplement") {
    allConcepts.push(...data.supplement_concepts.map((c: Concept) => ({ ...c, type: "supplement" })));
  }
  if (!TYPE_FILTER || TYPE_FILTER === "glossary") {
    allConcepts.push(...data.glossary_concepts.map((c: Concept) => ({ ...c, type: "glossary" })));
  }
  if (!TYPE_FILTER || TYPE_FILTER === "symptom") {
    allConcepts.push(...data.symptom_reference_concepts.map((c: Concept) => ({ ...c, type: "symptom" })));
  }

  let pending = allConcepts.filter((c) => c.status === "pending");
  if (SLUG_FILTER) pending = pending.filter((c) => c.slug === SLUG_FILTER);
  pending = pending.sort((a, b) => b.priority - a.priority).slice(0, MAX);

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would generate ${pending.length} concept(s):`);
    pending.forEach((c) => console.log(`  ${c.type}/${c.slug} (medical=${c.requires_medical_review})`));
    return;
  }

  if (pending.length === 0) { console.log("No pending concepts."); return; }

  const apiKey = loadEnvKey();
  if (!apiKey) { console.error("OPENAI_API_KEY not found"); process.exit(1); }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const results: unknown[] = [];

  for (const concept of pending) {
    console.log(`  ${concept.type}/${concept.slug} (medical=${concept.requires_medical_review})...`);
    try {
      let prompt: string;
      switch (concept.type) {
        case "breed": prompt = buildBreedPrompt(concept); break;
        case "supplement": prompt = buildSupplementPrompt(concept); break;
        case "symptom": prompt = buildSymptomPrompt(concept); break;
        default: prompt = buildGlossaryPrompt(concept);
      }

      const raw = await callOpenAI(prompt, apiKey);
      const generated = JSON.parse(raw);

      results.push({
        ...generated,
        schema_jsonld: buildSchema(concept.type ?? "glossary", concept.slug, generated.title, generated.metaDescription, concept.requires_medical_review),
        _meta: {
          generated_at: new Date().toISOString(),
          source: "fursbliss-generator",
          review_status: "pending",
          requires_vet_review: concept.requires_medical_review,
          type: concept.type,
        },
      });
      console.log(`    ✓ ${concept.slug}`);
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.error(`    ✗ ${concept.slug}:`, err);
    }
  }

  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const typeLabel = TYPE_FILTER ?? "mixed";
  const out = path.join(OUTPUT_DIR, `fursbliss-${typeLabel}-${ts}.json`);
  fs.writeFileSync(out, JSON.stringify(results, null, 2));
  console.log(`\n✓ Wrote ${results.length} entries to: ${out}`);

  const medicalCount = results.filter((r: unknown) => (r as { _meta: { requires_vet_review: boolean } })._meta.requires_vet_review).length;
  if (medicalCount > 0) {
    console.log(`\n⚠️  ${medicalCount} entries require veterinary/medical review before publishing.`);
    console.log("   Do NOT publish medical content without human review.");
  }
}

main().catch(console.error);
