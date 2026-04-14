# Quick Reference: Hermes → CardSnap Merge

## Files Created
- `convert-hermes-to-cardsnap.cjs` — Converter script
- `test-converted-entries.json` — Sample converted data (12 entries)
- `MANUAL-MERGE-STEPS.md` — Step-by-step merge guide
- `POC-SUMMARY.md` — Full PoC documentation

## One-Command Test
```bash
node seo-engine/convert-hermes-to-cardsnap.cjs
```
Output: `seo-engine/test-converted-entries.json` with 12 converted entries

## Where It Goes
**File:** `lib/generated-niche-content.ts`
**How:** Paste JSON entries into the `GENERATED_NICHE_CONTENT` object
**Auto-used by:** `lib/niche-content.ts` (line 325 spreads it into nicheContentMap)

## How Pages Pick It Up
**File:** `app/grade-or-skip/[slug]/page.tsx`
**Mechanism:** Reads from `nicheContentMap[params.slug]`
**Result:** New entries render automatically at `/grade-or-skip/{slug}`

## Browser Test
1. `npm run dev`
2. Visit: `http://localhost:3000/grade-or-skip/football`
3. Should see Football grading guide from data

## Build Test
1. `npm run build`
2. `npm run start`
3. Visit: `http://localhost:3000/grade-or-skip/football`
4. Check page title contains "Football Card Grading ROI"

## Verdict
✅ Conversion works  
✅ Format is compatible  
✅ Pages render automatically  
✅ No code changes needed (manual merge into JSON only)  

**Production ready as-is.**
