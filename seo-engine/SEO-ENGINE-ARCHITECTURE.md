# Autonomous SEO Engine — Master Architecture

**Version:** 1.0
**Date:** 2026-04-07
**Status:** v1 Implemented — ready for Hermes deployment

---

## Phase 1 Audit Results

### What Already Exists (Reuse Immediately)

| Component | Site | Status | Notes |
|-----------|------|--------|-------|
| `generateMetadata()` | All sites | ✅ Live | Full title/desc/OG on all dynamic routes |
| Config-driven page gen | SnapBrand | ✅ Live | `BUSINESS_TYPE_CONFIG` pattern — best in class |
| `seo-content-factory.ts` | SnapBrand | ✅ Exists | Already generates reviewable JSON — extended by engine |
| Sitemap | All sites | ✅ Live | Dynamic from data, auto-updates |
| GSC discovery pipeline | WatchThis | ✅ Fully autonomous | gsc-movieslike-sync.mjs — do not rebuild |
| Forge pipeline | WatchThis | ✅ Fully autonomous | 3x/day Hermes jobs already running |
| NicheContent config | CardSnap | ✅ Exists | grade-or-skip uses `niche-content.ts` |
| cards.json + generator | CardSnap | ✅ Exists | `generate-card-content.ts` via OpenAI |
| Breed pages | FursBliss | ✅ Exists | `lib/breed-pages.ts` — extensible |
| Symptom pages | FursBliss | ✅ Exists | `lib/symptom-pages.ts` — extensible |
| Blog content | FursBliss | ✅ Live | .tsx pages in `app/blog/` |
| Social/campaign scripts | FursBliss | ✅ Exists | `openclaw_social_cron.py`, `marketing_orchestrator.py` |
| Hermes cron schedule | WatchThis | ✅ Documented | `OPENCLAW-SCHEDULE-REFERENCE.txt` |
| Backlink queue | WatchThis | ✅ Exists | `growth/backlinks.csv` — extended in engine |

### What Was Missing (Now Built)

| Component | Status |
|-----------|--------|
| JSON-LD schema on all pages | Built — `components/JsonLd.tsx` per site |
| Normalized opportunity schema | Built — `types.ts` |
| Cross-site concept lists | Built — `concepts/*.json` |
| SnapBrand expansion list (44 new types) | Built — `concepts/snapbrand-concepts.json` |
| CardSnap expansion (12 sports + 15 cards) | Built — `concepts/cardsnap-concepts.json` |
| FursBliss cluster map | Built — `concepts/fursbliss-concepts.json` |
| SnapBrand autonomous generator | Built — `generators/snapbrand-generator.ts` |
| CardSnap autonomous generator | Built — `generators/cardsnap-generator.ts` |
| FursBliss hub generator | Built — `generators/fursbliss-generator.ts` |
| Opportunity discovery script | Built — `generators/opportunity-discovery.ts` |
| Output validation | Built — `reviewers/validate.ts` |
| Medical safety checker | Built — `reviewers/safety-check.ts` |
| Social draft generator | Built — `distro/social-draft-generator.ts` |
| Backlink queue (master) | Built — `distro/backlink-queue.json` |
| Reddit draft-only module | Built — `distro/reddit-drafts/` |
| Hermes daily/weekly scripts | Built — `hermes/seo-engine-daily.sh`, `seo-engine-weekly.sh` |
| Master config | Built — `config.json` |

---

## Architecture Overview

```
~/projects/seo-engine/          ← Master engine (run: mv cardsnap/seo-engine here)
├── config.json                  ← Site registry, cross-linking rules, Reddit status
├── types.ts                     ← All shared TypeScript types
├── package.json                 ← npm scripts shorthand
│
├── concepts/                    ← "What to build next" — edit these to grow
│   ├── snapbrand-concepts.json  ← 44 business types pending
│   ├── cardsnap-concepts.json   ← 12 sports + 15 card entries pending
│   └── fursbliss-concepts.json  ← breeds, supplements, glossary, symptoms
│
├── generators/                  ← OpenAI-powered content factories
│   ├── opportunity-discovery.ts ← Scans all sites for gaps, outputs opportunities
│   ├── snapbrand-generator.ts   ← BusinessTypeConfig entries → outputs/snapbrand/
│   ├── cardsnap-generator.ts    ← NicheContent + card entries → outputs/cardsnap/
│   └── fursbliss-generator.ts   ← Breed/supplement/glossary pages → outputs/fursbliss/
│
├── reviewers/
│   ├── validate.ts              ← SEO quality checks (titles, descriptions, schema)
│   └── safety-check.ts          ← FursBliss medical content safety scanner
│
├── outputs/                     ← Reviewable generated content (never auto-published)
│   ├── snapbrand/               ← BusinessTypeConfig JSON batches
│   ├── cardsnap/                ← NicheContent + card entry batches
│   └── fursbliss/               ← Page objects (breeds, supplements, glossary, symptoms)
│
├── distro/
│   ├── backlink-queue.json      ← Master directory submission tracker
│   ├── social-draft-generator.ts← TikTok/Reels/Shorts scripts (draft only)
│   ├── social-drafts/           ← Generated platform scripts
│   └── reddit-drafts/           ← Manual-only Reddit post drafts
│
└── hermes/
    ├── seo-engine-daily.sh      ← Hermes daily (8 AM): discovery + SnapBrand + CardSnap
    ├── seo-engine-weekly.sh     ← Hermes weekly (Sun 9 AM): FursBliss + card entries
    └── HERMES-SCHEDULE.md       ← Full setup, manual commands, review workflow
```

---

## Site Strategies

### SnapBrand — Utility Tool SEO

**Current:** 4 business types live
**Strategy:** Programmatic tool landing pages for every business category
**Target:** 50+ business types = 50 long-tail keyword pages
**Pattern:** `/logo-generator/[business-type]` — already deployed, just add entries to `config.ts`
**Schema:** `SoftwareApplication` + `FAQPage` + `WebPage` + `BreadcrumbList`
**Priority:** #1

Immediate additions (from concepts, highest priority):
- gym, podcast, nail-salon, jewelry, bakery, food-truck, barbershop
- nonprofit, church, personal-trainer, landscaping, wedding-photographer
- yoga-studio, law-firm, dental-practice

Future (v2): `/brand-kit/[business-type]` — same pattern, different intent

### CardSnap — Utility Tool SEO + Programmatic

**Current:** 3 grade-or-skip categories, cards.json with 10+ entries
**Strategy:** Expand grade-or-skip to all major card sports + TCG categories; expand card detail pages
**Pattern:** `/grade-or-skip/[category]` + `/cards/[slug]`
**Schema:** `Article` + `FAQPage` + `BreadcrumbList` on grade-or-skip; `Article` on card pages
**Priority:** #2

Key additions:
- football, yugioh, magic-the-gathering, one-piece, vintage — all have 1k+ monthly searches
- Patrick Mahomes, Charizard, Caitlin Clark, Victor Wembanyama card entries
- PSA Grading Calculator already live — add schema + internal linking from all grade-or-skip pages

### WatchThis/MoviesLike — Fully Autonomous (No Changes Needed)

**Current:** GSC-driven discovery → TMDB → forge → git push — already running 3x/day
**Engine role:** Discovery script imports top backlog items as opportunities for monitoring
**Cross-linking:** None needed — audience is fully separate
**Priority:** #3 — leave the pipeline alone, it works

### FursBliss — Hub / Authority / Glossary

**Current:** Breed pages, blog posts, supplement pages, symptom pages
**Strategy:** Build topical authority via comprehensive cluster pages. Hub is `/breeds/` + `/supplements/` + `/blog/` + (new) `/glossary/`
**Schema:** `Article` for informational, `MedicalWebPage` for health content
**Priority:** #4 (behind SnapBrand and CardSnap)

Key additions:
- Top 10 breeds: Labrador, German Shepherd, Golden Retriever, French Bulldog, Poodle, etc.
- Supplement glossary: omega-3, probiotics, glucosamine (high search volume, low competition)
- Longevity glossary: dog-years-to-human-years, dog-lifespan-by-breed
- Symptom pages: VERY cautious — only non-diagnostic, with disclaimers, flagged for vet review

**NEVER generate FursBliss content without running safety-check.ts first.**

---

## Hermes Schedule (Full Picture)

| Time        | Job                    | What Runs                                    |
|-------------|------------------------|----------------------------------------------|
| 6:00 AM     | movieslike-vega        | WatchThis GSC daily (EXISTING)               |
| 7:00 AM     | movieslike-forge       | WatchThis Forge morning (EXISTING)           |
| 8:00 AM     | seo-engine-daily (NEW) | SEO engine: discovery + SnapBrand + CardSnap grade-or-skip |
| 8:00 AM     | movieslike-rev         | WatchThis rev audit (EXISTING)               |
| 9:00 AM     | fursbliss-campaign     | FursBliss campaign (EXISTING)                |
| 9:30 AM     | fursbliss-dalle        | FursBliss DALL-E (EXISTING)                  |
| 10:00 AM    | fursbliss-social       | FursBliss social (EXISTING)                  |
| 10:00 AM    | movieslike-link        | WatchThis link daily (EXISTING)              |
| 1:00 PM     | movieslike-forge       | WatchThis Forge afternoon (EXISTING)         |
| 7:00 PM     | movieslike-forge       | WatchThis Forge evening (EXISTING)           |
| Sun 9:00 AM | seo-engine-weekly (NEW)| FursBliss + CardSnap card entries            |

---

## Internal Linking Rules

| From | To | Rule |
|------|----|------|
| SnapBrand logo page | Related SnapBrand pages | `relatedTypes` field — already in config |
| CardSnap grade-or-skip | PSA Calculator | Link from every grade-or-skip page |
| CardSnap grade-or-skip | Related sports | Cross-link similar categories |
| FursBliss breed | Breed quiz | Link to `/quiz` from every breed page |
| FursBliss breed | Related supplements | Link omega-3/glucosamine etc. from relevant breeds |
| FursBliss supplement | Interaction checker | Link to `/interaction-checker` |
| FursBliss symptom | Triage tool | Link to `/triage` and `/er-triage-for-dogs` |
| Any site | Another site | NO cross-site links unless audiences overlap (none do) |

---

## Content Quality Rules

### Global
- Minimum 155 characters for meta descriptions
- Maximum 60 characters for title tags
- Every page must have JSON-LD schema
- Every page must have canonical URL
- Every page must be in sitemap

### SnapBrand
- Every business type entry must have 4+ unique benefits (not generic)
- 5 FAQs per type, specific to the industry
- 3 related business types for internal linking

### CardSnap
- ROI math must be verifiable: psa9Roi = psa9Value - rawValue - gradingCost
- Card names in ROI examples must be real cards with realistic values
- All grade-or-skip pages link back to PSA calculator

### FursBliss (Medical Safety)
- NEVER make diagnostic claims
- ALWAYS include medical disclaimer on symptom + supplement pages
- NEVER recommend specific drug doses
- ALWAYS encourage vet consultation
- Safety-check.ts must pass before ANY content is merged
- Medical content (requires_vet_review: true) requires human review before publishing

---

## Reddit Module — Current Status

**Status: DRAFT ONLY**
**Reason: No Reddit API approval**

What you CAN do now:
- Read public Reddit JSON: `https://reddit.com/r/sportscards.json` (no auth)
- Use reddit drafts in `distro/reddit-drafts/` for manual posting
- Track which subreddits are targets in `distro/backlink-queue.json`

What is BLOCKED until API approval:
- Any automated posting or commenting
- OAuth flows
- Rate-limited scraping beyond public JSON

---

## Rollout Plan

### v1 — Minimal Usable Engine (NOW — this week)

**Actions:**

1. `mv ~/projects/cardsnap/seo-engine ~/projects/seo-engine`
2. `cd ~/projects/seo-engine && npm install`
3. Add `hermes skill add seo-engine-daily` + cron
4. Add `hermes skill add seo-engine-weekly` + cron
5. Run first discovery: `npm run discover`
6. Generate first SnapBrand batch: `npm run generate:snapbrand -- --max 5`
7. Review `outputs/snapbrand/`, run `npm run validate`
8. Merge approved entries into SnapBrand `config.ts`
9. Add `<JsonLd>` to SnapBrand logo generator page component
10. Add `<JsonLd>` to CardSnap grade-or-skip pages
11. Deploy both sites

**Expected output of v1:** 5-10 new SnapBrand pages, schema on all existing pages

### v2 — Distribution Module (2-4 weeks)

- Generate social drafts for new SnapBrand pages
- Work through backlink-queue.json (Product Hunt, SaaSHub, etc.)
- Generate CardSnap football + yugioh grade-or-skip pages
- Generate FursBliss breed + supplement pages (after safety review)
- Manual Reddit posts from distro/reddit-drafts/

### v3 — More Autonomy (4-8 weeks)

- Add GSC integration for SnapBrand + CardSnap (read GSC data to find gaps)
- FursBliss symptom pages after veterinary review pipeline established
- Glossary cluster for FursBliss (`/glossary/[slug]` route)
- Auto-status updates: mark concepts as `"live"` when URLs appear in sitemap
- SnapBrand brand-kit pages at `/brand-kit/[business-type]`

---

## Files Created by This Engine

### New to seo-engine/

- `config.json`
- `types.ts`
- `package.json`
- `concepts/snapbrand-concepts.json` — 44 pending business types
- `concepts/cardsnap-concepts.json` — 12 sports + 15 card entries
- `concepts/fursbliss-concepts.json` — breeds, supplements, glossary, symptoms
- `generators/opportunity-discovery.ts`
- `generators/snapbrand-generator.ts`
- `generators/cardsnap-generator.ts`
- `generators/fursbliss-generator.ts`
- `reviewers/validate.ts`
- `reviewers/safety-check.ts`
- `distro/backlink-queue.json`
- `distro/social-draft-generator.ts`
- `distro/reddit-drafts/README.md`
- `distro/reddit-drafts/cardsnap-grading-calculator.md`
- `distro/reddit-drafts/fursbliss-longevity.md`
- `hermes/seo-engine-daily.sh`
- `hermes/seo-engine-weekly.sh`
- `hermes/HERMES-SCHEDULE.md`
- `SEO-ENGINE-ARCHITECTURE.md` (this file)

### New to SnapBrand

- `components/JsonLd.tsx` — Schema injection component

### New to CardSnap

- `components/JsonLd.tsx` — Schema injection component with card-specific factories

---

## What Still Needs to Be Done (Manual Steps)

1. **Move engine:** `mv ~/projects/cardsnap/seo-engine ~/projects/seo-engine`
2. **Add JsonLd to SnapBrand page.tsx** — import and use `logoGeneratorSchema()` + `faqSchema()`
3. **Add JsonLd to CardSnap grade-or-skip pages** — import and use `gradeOrSkipSchema()`
4. **Add JsonLd to CardSnap PSA calculator page** — use `calculatorSchema()`
5. **Add football grade-or-skip page** — after generating + approving, create the `.tsx` file
6. **FursBliss glossary route** — create `app/glossary/[slug]/page.tsx` (doesn't exist yet)
7. **Run initial SnapBrand batch** — generate, validate, review, merge
8. **Register Hermes jobs** — see `hermes/HERMES-SCHEDULE.md`
9. **Add `OPENAI_API_KEY` to Hermes environment**
10. **Submit to Product Hunt** — use copy from `distro/backlink-queue.json`

---

## Can Do Now vs Blocked

### Can Do Now

- All SnapBrand generator runs
- All CardSnap generator runs
- FursBliss breed/supplement/glossary generator runs
- Discovery script
- Validation
- Social draft generation
- Backlink submissions (except Reddit)
- Hermes job registration

### Blocked Until Reddit API Approval

- `distro/reddit-drafts/` automated posting
- Any comment/reply automation on Reddit
- OAuth Reddit authentication

### Optional Later (v3+)

- GSC data integration for SnapBrand + CardSnap (need service account per site)
- FursBliss symptom pages (need vet review pipeline)
- SnapBrand `/brand-kit/[business-type]` pages
- WatchThis social video automation
- SnapBrand comparison pages (e.g., "SNAPBRAND vs Looka")
- FursBliss community features
