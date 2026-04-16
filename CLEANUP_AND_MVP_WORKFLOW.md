# CardSnap MVP Cleanup & Workflow Guide

**Status:** Audit complete. Cleanup blocked by filesystem permissions.  
**Date:** April 13, 2026

---

## SUMMARY

The MVP implementation is **COMPLETE AND TESTED** with real Hermes data. All code exists but is **UNTRACKED** in git. Due to filesystem permission constraints, you'll need to execute cleanup and commit in a fresh shell context.

---

## PART 1: FILES TO COMMIT (19 files)

These are the essential MVP files. **Add all of these to git immediately:**

### Documentation (6 files)
```
seo-engine/IMPLEMENTATION_SUMMARY.txt
seo-engine/MANUAL-MERGE-STEPS.md
seo-engine/MVP_COMPLETE.md
seo-engine/POC-SUMMARY.md
seo-engine/QUICKREF.md
seo-engine/QUICKSTART.md
```

### Test & Test Data (3 files)
```
seo-engine/test-mvp.js                    ← PROVEN WORKING with 12 entries
seo-engine/test-converted-entries.json
seo-engine/test-entry-sample.json
```

### TypeScript Implementation (7 files — CORE MVP)
```
seo-engine/transforms/base-transformer.ts
seo-engine/transforms/cardsnap-transformer.ts
seo-engine/transforms/cardsnap-merger.ts
seo-engine/transforms/run-all-transforms.ts
seo-engine/transforms/staging-reviewer.ts
seo-engine/transforms/types.ts
seo-engine/transforms/utils.ts

seo-engine/validators/base-validator.ts
seo-engine/validators/cardsnap-validator.ts
```

### Real Data (2 directories)
```
seo-engine/staging/               ← Contains approved entries ready to merge
seo-engine/outputs/               ← (May already be in git; verify)
```

**Total:** 19 new files + directories with real data ready to merge

---

## PART 2: FILES TO DELETE (8 STALE ARTIFACTS)

These are outdated/superseded files that should be removed:

### Stale JavaScript Transpiles (6 files — DELETE)
```
seo-engine/transforms/base-transformer.js        ← Outdated transpile of .ts
seo-engine/transforms/cardsnap-transformer.js    ← Outdated transpile of .ts
seo-engine/transforms/types.js                   ← Outdated transpile of .ts
seo-engine/transforms/utils.js                   ← Outdated transpile of .ts
seo-engine/validators/base-validator.js          ← Outdated transpile of .ts
seo-engine/validators/cardsnap-validator.js      ← Outdated transpile of .ts
```

### Superseded PoC Scripts (2 files — DELETE)
```
seo-engine/convert-hermes-to-cardsnap.cjs       ← PoC proof, replaced by transformer
seo-engine/cardsnap-merger-standalone.cjs       ← Standalone PoC, replaced by merger
```

**Reason for deletion:** These are artifacts from development. The .ts versions are current and authoritative.

---

## PART 3: COMMIT INSTRUCTIONS

**Option A: Fresh Shell (Recommended)**

Open a NEW terminal/shell in the CardSnap directory and run:

```bash
cd /path/to/cardsnap

# 1. Delete stale artifacts
rm -f seo-engine/transforms/*.js seo-engine/validators/*.js seo-engine/*.cjs

# 2. Stage MVP files
git add \
  seo-engine/IMPLEMENTATION_SUMMARY.txt \
  seo-engine/MANUAL-MERGE-STEPS.md \
  seo-engine/MVP_COMPLETE.md \
  seo-engine/POC-SUMMARY.md \
  seo-engine/QUICKREF.md \
  seo-engine/QUICKSTART.md \
  seo-engine/test-mvp.js \
  seo-engine/test-converted-entries.json \
  seo-engine/test-entry-sample.json \
  seo-engine/staging/ \
  seo-engine/transforms/base-transformer.ts \
  seo-engine/transforms/cardsnap-transformer.ts \
  seo-engine/transforms/cardsnap-merger.ts \
  seo-engine/transforms/run-all-transforms.ts \
  seo-engine/transforms/staging-reviewer.ts \
  seo-engine/transforms/types.ts \
  seo-engine/transforms/utils.ts \
  seo-engine/validators/base-validator.ts \
  seo-engine/validators/cardsnap-validator.ts

# 3. Verify staging
git status --short | grep "^A"

# 4. Commit
git commit -m "seo engine: add hermes mvp (phase 1-2)

- Phase 1: Shared foundation (transforms, validators, utils)
- Phase 2: CardSnap implementation (transformer, validator, merger)
- Real data: 12 entries validated, staged, and ready to merge
- Test: full workflow proven with Hermes grade-or-skip output

Docs: implementation summary, poc summary, quickstart
Test: test-mvp.js validates pipeline end-to-end
Staging: approved entries in staging/cardsnap/approved/

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"

# 5. Verify
git log --oneline -1
git status
```

**Option B: Without Fresh Shell**

If you're in the same shell with permission issues, try:

```bash
# Kill any hung git processes
pkill -f "git.*index.lock" || true

# Force delete lock file (may require sudo)
sudo rm -f /path/to/cardsnap/.git/index.lock

# Then run the commit commands from Option A
```

---

## PART 4: ONE CLEAN MVP WORKFLOW

Once committed, the **single recommended workflow** is:

```bash
# ============ STEP 1: VALIDATE & STAGE ============
cd cardsnap
node seo-engine/test-mvp.js

# Output shows:
#   ✓ Found: grade-or-skip-2026-04-10T19-05-05.json
#   ✓ Parsed 12 entries
#   ✓ Validated all 12 entries
#   ✓ Staged to: seo-engine/staging/cardsnap/pending/grade-or-skip-*.staged.json

# ============ STEP 2: REVIEW ============
cat seo-engine/staging/cardsnap/pending/*.staged.json | jq '.entries[0]'

# ============ STEP 3: APPROVE (Manual — Move from pending → approved) ============
mv seo-engine/staging/cardsnap/pending/*.staged.json \
   seo-engine/staging/cardsnap/approved/

# ============ STEP 4: MERGE TO LIVE ============
npx tsx seo-engine/transforms/cardsnap-merger.ts

# Output:
#   ✅ Merge completed successfully
#      Merged: 12 entries
#      File: lib/generated-niche-content.ts
#      Backup: lib/generated-niche-content.ts.backup-{timestamp}

# ============ STEP 5: BUILD & DEPLOY ============
npm run build

# Verify new pages exist
grep "football\|yugioh\|magic" .next/server/app/sitemap.xml

# ============ STEP 6: COMMIT ============
git add lib/generated-niche-content.ts
git commit -m "seo batch: merge hermes grade-or-skip entries

Added 12 new grade-or-skip pages from Hermes:
  football, yugioh, magic-the-gathering, one-piece, vintage,
  rookie-cards, soccer, hockey, lorcana, golf, ufc, wrestling

All entries validated, approved, merged, and tested."

git push
```

---

## PART 5: EXPECTED RESULTS

### After Commit (Step 0):
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

Files tracked:
```
seo-engine/transforms/          ✓
seo-engine/validators/          ✓
seo-engine/staging/             ✓
seo-engine/test-mvp.js          ✓
seo-engine/IMPLEMENTATION_SUMMARY.txt  ✓
seo-engine/MVP_COMPLETE.md      ✓
... (all .md files)            ✓
```

Files deleted:
```
seo-engine/transforms/*.js       ✗ (gone)
seo-engine/validators/*.js       ✗ (gone)
seo-engine/*.cjs                 ✗ (gone)
```

### After Run (Step 1-6):
```
lib/generated-niche-content.ts   ← Updated with 12 new entries
.next/server/app/grade-or-skip/ ← New static pages generated
sitemap.xml                      ← Includes new routes
```

---

## PART 6: ARCHITECTURE DECISION

### Old Python System (`seo_batch.py` + `projects.json`)
- ✓ In git, currently referenced
- ✗ No validation before merge
- ✗ No approval gate
- ✗ Direct file write (risky)

### New TypeScript MVP
- ✓ Comprehensive validation
- ✓ Staging/approval gate
- ✓ Better error handling
- ✓ Extensible for Phase 3-5
- ✓ Proven with real data

**RECOMMENDATION:** Use TypeScript MVP. Old Python system can be deprecated or kept for reference.

---

## PART 7: FILES BY CATEGORY

### ✓ KEEP & COMMIT
```
.ts files in transforms/ and validators/
test-mvp.js
All documentation (.md files)
staging/ directory
test-converted-entries.json
test-entry-sample.json
IMPLEMENTATION_SUMMARY.txt
```

### ✗ DELETE
```
All .js files in transforms/ and validators/
convert-hermes-to-cardsnap.cjs
cardsnap-merger-standalone.cjs
```

### ? NOT CHANGED
```
generators/    (already in git, working)
concepts/      (already in git, working)
distro/        (already in git, working)
hermes/        (already in git, working)
outputs/       (check if already in .gitignore)
```

---

## PART 8: TROUBLESHOOTING

### "Cannot commit — git index.lock exists"
```bash
sudo rm -f .git/index.lock
git status
```

### "Transformer not found"
```bash
# Verify tsx is installed
npm list tsx

# If missing
npm install tsx
```

### "Merge failed — file not found"
```bash
# Verify paths
ls -la lib/generated-niche-content.ts
ls -la seo-engine/staging/cardsnap/approved/*.approved.json
```

### "Build fails after merge"
```bash
# Check TypeScript syntax
npx tsc --noEmit

# Check for merge conflicts
git diff lib/generated-niche-content.ts
```

---

## FINAL CHECKLIST

- [ ] Delete stale .js and .cjs files (fresh shell)
- [ ] Run `git add` for all MVP files
- [ ] Run `git commit`
- [ ] Verify: `git log --oneline -1`
- [ ] Test MVP workflow: `node test-mvp.js`
- [ ] Merge: `npx tsx transforms/cardsnap-merger.ts`
- [ ] Build: `npm run build`
- [ ] Verify: `grep "football" .next/server/app/sitemap.xml`
- [ ] Commit merge: `git commit -m "seo batch: merge hermes entries"`
- [ ] Push: `git push`

---

## SUMMARY TABLE

| Task | Status | Command |
|------|--------|---------|
| Identify MVP files | ✓ Done | See "PART 1" |
| Delete stale artifacts | ⏳ Pending | See "PART 3, Option A" |
| Commit to git | ⏳ Pending | See "PART 3" |
| Run MVP workflow | ⏳ Ready | See "PART 4" |
| Deploy | ⏳ Ready | See "PART 4, Step 5-6" |

**Next action:** Open a fresh shell and run the commands from PART 3, Option A.

---

**Created:** 2026-04-13  
**For:** Clean MVP cleanup and git protection
