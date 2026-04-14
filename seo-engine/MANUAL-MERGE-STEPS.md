# Manual Hermes → CardSnap Merge Steps

## Step 1: Convert Hermes JSON to CardSnap format
```bash
node seo-engine/convert-hermes-to-cardsnap.cjs
```
Output: `seo-engine/test-converted-entries.json`

## Step 2: View converted entries
```bash
cat seo-engine/test-converted-entries.json | jq 'keys'
```
Shows all slugs ready to add.

## Step 3: Extract one entry (example: yugioh)
```bash
cat seo-engine/test-converted-entries.json | jq '.yugioh' > seo-engine/entry-yugioh-test.json
```

## Step 4: Merge into CardSnap's data structure

**File to modify:** `lib/generated-niche-content.ts`

**What to do:**
1. Open the file
2. Find the line: `export const GENERATED_NICHE_CONTENT = {`
3. Add the new entry before the closing `};`

**Example (manual paste):**
```typescript
export const GENERATED_NICHE_CONTENT = {
  "football": { ... },
  "yugioh": {
    "slug": "yugioh",
    "sport": "Yu-Gi-Oh",
    // ... rest of entry from test-converted-entries.json
  }
}
```

**Or programmatically** (using Node/TypeScript script):
- Read `test-converted-entries.json`
- Parse `generated-niche-content.ts`
- Merge the objects
- Write back to `generated-niche-content.ts`

## Step 5: Verify pages pick it up

CardSnap uses these existing mechanisms (no changes needed):

1. **Auto-page generation via generateStaticParams()**
   - File: `app/[sport]/[slug]/page.tsx`
   - It reads `GENERATED_NICHE_CONTENT` keys automatically
   - New slugs are detected at build time

2. **Sitemap auto-inclusion**
   - File: `app/sitemap.ts`
   - Reads from `GENERATED_NICHE_CONTENT` keys
   - New entries included automatically

3. **SEO metadata**
   - Uses `seoTitle`, `seoDescription` from the entry
   - Already in Hermes format

## Step 6: Test locally

```bash
# Build (generates static pages)
npm run build

# Verify new page exists in build output
ls -la .next/server/app/yu-gi-oh/yugioh

# Start dev server to test
npm run dev

# Navigate to: http://localhost:3000/yu-gi-oh/yugioh
```

## Step 7: Verify in sitemap.xml
```bash
# After build, check sitemap
cat .next/static/sitemap.xml | grep yugioh
```
Should show the new entry.

## Status

✅ Conversion: Hermes JSON → CardSnap format (done)
✅ Format compatibility: Identical format (verified)
✅ Merge mechanism: Manual paste or programmatic merge
✅ Page pickup: Automatic via existing generateStaticParams()
✅ Sitemap: Automatic via existing sitemap.ts

**No framework changes needed.** The existing CardSnap infrastructure picks up new entries automatically.
