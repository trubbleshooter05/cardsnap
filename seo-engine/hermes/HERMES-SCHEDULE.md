# SEO Engine — Hermes Schedule & Setup

## Prerequisites

1. SEO engine lives at `~/projects/seo-engine/`
2. Node.js + `npx tsx` available (already used by WatchThis)
3. `OPENAI_API_KEY` set in environment or sourced from site `.env.local` files
4. (Optional) `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` for notifications

## Installation

```zsh
# 1. Move engine to standard location
mv ~/projects/cardsnap/seo-engine ~/projects/seo-engine

# 2. Install dependencies
cd ~/projects/seo-engine
npm init -y
npm install tsx typescript @types/node

# 3. Make scripts executable
chmod +x hermes/seo-engine-daily.sh
chmod +x hermes/seo-engine-weekly.sh

# 4. Test dry-run
npx tsx generators/opportunity-discovery.ts --dry-run
npx tsx generators/snapbrand-generator.ts --dry-run
npx tsx generators/cardsnap-generator.ts --mode grade-or-skip --dry-run
```

## Hermes Job Registration

Add these to Hermes. Verify with `hermes cron list` after.

```
hermes skill add seo-engine-daily   --script ~/projects/seo-engine/hermes/seo-engine-daily.sh
hermes skill add seo-engine-weekly  --script ~/projects/seo-engine/hermes/seo-engine-weekly.sh

hermes cron add "0 8 * * *"   seo-engine-daily    # Daily at 8 AM
hermes cron add "0 9 * * 0"   seo-engine-weekly   # Sundays at 9 AM
```

## Existing Hermes Jobs (from WatchThis — DO NOT MODIFY)

These are already running. The SEO engine adds NEW jobs alongside them.

| ID           | Name              | Schedule      | Skill            |
|--------------|-------------------|---------------|------------------|
| f61bb0d3afe5 | Vega GSC Daily    | 0 6 * * *     | movieslike-vega  |
| eeb2dbe2867d | Forge Morning     | 0 7 * * *     | movieslike-forge |
| a25df632449d | Forge Afternoon   | 0 13 * * *    | movieslike-forge |
| 0e591972308a | Forge Evening     | 0 19 * * *    | movieslike-forge |
| b354998eb100 | Rev Daily Audit   | 0 8 * * *     | movieslike-rev   |
| f37d51ec4fcc | Link Daily        | 0 10 * * *    | movieslike-link  |
| e8e60f7e95e3 | FursBliss Campaign| 0 9 * * *     | fursbliss-campaign |

## New SEO Engine Jobs

| Name                | Schedule    | What It Does                                      |
|---------------------|-------------|---------------------------------------------------|
| seo-engine-daily    | 0 8 * * *   | Discovery + SnapBrand + CardSnap grade-or-skip     |
| seo-engine-weekly   | 0 9 * * 0   | FursBliss breeds/supplements + CardSnap card entries |

Note: `seo-engine-daily` runs at 8 AM, same as `movieslike-rev`. Both are read-only during discovery phase — no conflict.

## Manual Run Commands

```zsh
# Discovery only
cd ~/projects/seo-engine && npx tsx generators/opportunity-discovery.ts

# SnapBrand: generate 5 new business type pages
npx tsx generators/snapbrand-generator.ts --max 5

# SnapBrand: specific slug
npx tsx generators/snapbrand-generator.ts --slug yoga-studio

# CardSnap: new grade-or-skip categories
npx tsx generators/cardsnap-generator.ts --mode grade-or-skip --max 3

# CardSnap: specific sport
npx tsx generators/cardsnap-generator.ts --mode grade-or-skip --slug football

# CardSnap: card detail entries
npx tsx generators/cardsnap-generator.ts --mode card-entry --max 5

# FursBliss: breed pages
npx tsx generators/fursbliss-generator.ts --type breed --max 5

# FursBliss: supplement pages
npx tsx generators/fursbliss-generator.ts --type supplement --max 3

# FursBliss: SYMPTOM pages (ALWAYS manual trigger only — never scheduled)
npx tsx generators/fursbliss-generator.ts --type symptom --max 1
npx tsx reviewers/safety-check.ts --file outputs/fursbliss/fursbliss-symptom-*.json

# Validate all outputs
npx tsx reviewers/validate.ts

# Social drafts for a page
npx tsx distro/social-draft-generator.ts --site snapbrand --slug yoga-studio
npx tsx distro/social-draft-generator.ts --site cardsnap --slug football
```

## Review → Merge Workflow

After Hermes generates output files:

### SnapBrand
1. Review `~/projects/seo-engine/outputs/snapbrand/snapbrand-batch-*.json`
2. Run: `npx tsx reviewers/validate.ts --dir outputs/snapbrand`
3. Copy approved entries into `~/projects/snapbrand/app/logo-generator/[business-type]/config.ts`
4. Add `<JsonLd>` call to the page component with schema from the output
5. Update the concept status to `"live"` in `concepts/snapbrand-concepts.json`
6. Deploy via normal Vercel push

### CardSnap — Grade or Skip
1. Review `~/projects/seo-engine/outputs/cardsnap/grade-or-skip-*.json`
2. Run: `npx tsx reviewers/validate.ts --dir outputs/cardsnap`
3. Copy entry into `~/projects/cardsnap/lib/niche-content.ts`
4. Create `~/projects/cardsnap/app/grade-or-skip/[slug]/page.tsx` (copy from baseball template)
5. Add slug to `app/sitemap.ts`
6. Update concept status, deploy

### CardSnap — Card Entries
1. Review `~/projects/seo-engine/outputs/cardsnap/card-entries-*.json`
2. Append approved entries to `~/projects/cardsnap/data/cards.json`
3. Deploy

### FursBliss
1. Review `~/projects/seo-engine/outputs/fursbliss/*.json`
2. Run safety check: `npx tsx reviewers/safety-check.ts --file [file]`
3. Items with `requires_vet_review: true` — get human veterinary review FIRST
4. For approved breed pages: add to `~/projects/fursbliss/lib/breed-pages.ts`
5. For supplements: create `~/projects/fursbliss/app/supplements/[slug]/page.tsx`
6. For glossary: create `~/projects/fursbliss/app/glossary/[slug]/page.tsx`
7. Update sitemap, deploy

## What Requires Manual Review (Never Auto-Publish)

- All FursBliss symptom content
- FursBliss supplement content with `requires_medical_review: true`
- Any FursBliss content about specific drug dosing (rapamycin, NMN)
- Reddit draft posts (always manual — no API auth)
- Social scripts (review before filming)
- SnapBrand entries with unusual/sensitive business types

## Environment Variables

```zsh
# Required for generators
OPENAI_API_KEY=sk-...

# Optional — Telegram notifications
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Optional — override base paths
SEO_ENGINE_DIR=~/projects/seo-engine
HERMES_BASE=~/projects
```

Set these in `~/.hermes/.env` or `~/.zshrc` for persistence.
