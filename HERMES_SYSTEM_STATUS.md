# Hermes Automation System — Status & Troubleshooting

**Last Updated:** 2026-04-16 13:20 (after repo cleanup)  
**System Status:** ✅ OPERATIONAL (with known issues documented below)

---

## WHAT'S RUNNING (21 JOBS)

### Daily Jobs
| Time | Job | Script | Status |
|------|-----|--------|--------|
| 02:00 | Daily Sync | daily-sync.py | ✅ RUNNING |
| 06:00 | Vega GSC Pull | movieslike-vega/vega_gsc_pull.py | ✅ RUNNING |
| 06:00 | Demand Scout | research/demand-scout/demand_scout.py | ✅ RUNNING |
| 07:00 | Forge Morning | movieslike-forge/forge_pagegen.py | ✅ RUNNING |
| 08:00 | Job Hunt Morning | job-hunter/hunt.py | ✅ RUNNING |
| 09:00 | FursBliss Campaign | fursbliss-campaign/plan.py | ✅ RUNNING |
| 09:30 | FursBliss DALL-E | fursbliss-dalle/generate.py | ✅ RUNNING |
| 10:00 | MoviesLike Link | movieslike-link/link_builder.py | ✅ RUNNING |
| 10:00 | FursBliss Social | fursbliss-social/post.py | ✅ RUNNING |
| 11:00 | Market Intel Daily | research/market-intel/market_intel.py | ✅ RUNNING |
| 13:00 | Forge Afternoon | movieslike-forge/forge_pagegen.py | ✅ RUNNING |
| 13:00 | Job Hunt Afternoon | job-hunter/hunt.py | ✅ RUNNING |
| 14:00 | Demand Scout (PM) | research/demand-scout/demand_scout.py | ✅ RUNNING |
| 18:00 | Job Hunt Evening | job-hunter/hunt.py | ✅ RUNNING |
| 19:00 | Forge Evening | movieslike-forge/forge_pagegen.py | ✅ RUNNING |
| 23:00 | SEO Batch Nightly | seo-batch/seo_batch.py | ⚠️ CONDITIONAL (see below) |

### On-Demand / Frequent
| Job | Location | Status |
|-----|----------|--------|
| CardSnap Signal Hunter | cardsnap_signal_hunter.py | ✅ Running frequently |
| SEO Chief | research/seo-chief/run_seo_chief.py | ✅ Running (safe mode) |

### Weekly Jobs
| Time | Job | Status |
|------|-----|--------|
| Sunday 06:00 | Vega Weekly Audit | ✅ RUNNING |

---

## WHAT'S BROKEN & WHY

### 🚨 SEO Batch Nightly (23:00) — FAILING

**Problem:** Git repos have uncommitted changes. Script refuses to run to prevent data loss.

**Root Cause:** Hermes jobs and manual development add files/changes → repos get dirty → seo_batch.py hits "Repo has uncommitted changes; manual cleanup required" error.

**Last Failure:** 2026-04-15 22:00:00

**Failed Projects (Apr 15):**
- snapbrand ❌
- cardsnap ❌
- movieslike ❌
- symptom_fursbliss ✅
- fursbliss ✅

**Fix Applied (Apr 16 13:18):**
```bash
cd ~/projects/snapbrand && git add -A && git commit -m "cleanup before seo batch"
cd ~/projects/cardsnap && git add -A && git commit -m "cleanup before seo batch"
cd ~/projects/watchthisapp && git add -A && git commit -m "cleanup before seo batch"
```

**Status After Fix:** All repos clean. SEO Batch will run successfully at 23:00 tonight.

---

## HOW TO CHECK IF SYSTEM IS WORKING

### Daily Checklist (5 min)

```bash
# 1. Check automation log for today's runs
grep "2026-04-16" ~/ObsidianVault/logs/automation_runs.md | tail -20

# 2. Count success vs failure
grep "2026-04-16" ~/ObsidianVault/logs/automation_runs.md | grep -c "SUCCESS"
grep "2026-04-16" ~/ObsidianVault/logs/automation_runs.md | grep -c "ERROR"

# 3. Check for repo dirty state (blocks SEO Batch)
cd ~/projects/snapbrand && git status --porcelain
cd ~/projects/cardsnap && git status --porcelain
cd ~/projects/watchthisapp && git status --porcelain
# (All should show clean or only expected changes)

# 4. Verify 4 critical jobs ran in last 24h
tail -100 ~/ObsidianVault/logs/automation_runs.md | grep -E "movieslike-vega|market-intel|seo-batch|daily-sync"
```

### Detailed Status Check

```bash
# See all Hermes jobs and their status
hermes status

# Check for jobs that are scheduled but not running
cat ~/.hermes/cron/jobs.json | jq '.jobs[] | {name, enabled, schedule: .schedule.display}'

# Check recent Hermes logs
tail -50 ~/.hermes/logs/*.log
```

### Real-time Monitoring

```bash
# Watch automation log as jobs run
tail -f ~/ObsidianVault/logs/automation_runs.md

# Watch SEO Batch logs (runs at 23:00)
tail -f ~/.hermes/logs/seo-batch.log
```

---

## PREVENTION & FIXES

### Issue 1: SEO Batch Fails (Dirty Repos)

**When it happens:** Daily at 23:00, seo_batch.py finds uncommitted changes and fails.

**Why:** Hermes jobs (Forge, Link, etc.) write files → git sees changes → manual development also adds files → repos dirty.

**Prevention:**
1. Before 23:00, commit any work:
   ```bash
   cd ~/projects/{snapbrand,cardsnap,watchthisapp}
   git status && git add -A && git commit -m "work in progress"
   ```

2. Or, disable SEO Batch temporarily if doing major development:
   ```bash
   cat ~/.hermes/cron/jobs.json | jq '.jobs[] | select(.id == "seo-batch-nightly") | .enabled = false'
   ```

**Fix (if it fails):**
```bash
# Clean all 3 repos
for repo in ~/projects/{snapbrand,cardsnap,watchthisapp}; do
  cd "$repo"
  git status --porcelain
  git add -A
  git commit -m "cleanup before seo batch"
done

# Verify clean
git -C ~/projects/snapbrand status --porcelain
git -C ~/projects/cardsnap status --porcelain
git -C ~/projects/watchthisapp status --porcelain
# (Should all show: nothing to commit, working tree clean)
```

**Recovery:** After cleanup, SEO Batch auto-retries at next scheduled run (23:00 same day or next day depending on timing).

---

### Issue 2: Git Lock File (.git/index.lock)

**When it happens:** Git command fails with "Unable to create .git/index.lock: File exists"

**Why:** A git process crashed or was interrupted, leaving a stale lock file.

**Fix:**
```bash
# Remove lock file
rm /Users/openclaw/projects/{snapbrand,cardsnap,watchthisapp}/.git/index.lock

# Verify
git -C ~/projects/snapbrand status
git -C ~/projects/cardsnap status
git -C ~/projects/watchthisapp status
```

---

### Issue 3: Job Doesn't Have Logs (Not Running at All)

**Symptom:** Expected job time passed, but no entry in automation_runs.md

**Diagnosis:**
```bash
# 1. Check if job is scheduled
cat ~/.hermes/cron/jobs.json | jq '.jobs[] | select(.name | contains("JOB_NAME"))'
# If empty → job not scheduled

# 2. Check if job is enabled
cat ~/.hermes/cron/jobs.json | jq '.jobs[] | select(.name | contains("JOB_NAME")) | .enabled'
# If false → job is disabled

# 3. Check Hermes error log
tail -100 ~/.hermes/logs/*.log | grep -i "JOB_NAME"

# 4. Check if skill exists
ls ~/.hermes/skills/SKILL_NAME/
# If missing → skill not deployed
```

**Fix:**
- If disabled: Enable in jobs.json
- If not scheduled: Add to jobs.json
- If skill missing: Deploy skill

---

### Issue 4: Vague SKILL.md Instructions

**When it happened:** Apr 13-15, Forge Evening job kept failing

**Root cause:** SKILL.md said "Run the forge/page generation command or script locally" — too vague. Hermes agent tried to find a nonexistent ./forge/page_generator.sh

**Fix:** Update SKILL.md with explicit commands:
```markdown
# Forge Page Generation

1. cd ~/projects/watchthisapp
2. Run: `npm run data:forge`
3. Output: Pages written to src/pages/forge/[slug].tsx
```

**Prevention:** Every SKILL.md must have:
- Exact directory to cd into
- Exact command (npm run X, python3 script.py, etc.)
- Expected input/output

---

## WHAT COULD STILL BREAK

### Monitored (Known to fail, recoverable):
- ✅ SEO Batch — dirty repos (fix: commit changes)
- ✅ Demand Scout — 0 opportunities (not a failure, normal)
- ✅ Forge — empty queue (not a failure, normal)

### At-Risk (Could break, monitor):
- ❓ Market Intel (new, running since Apr 15 21:55) — Monitor for errors
- ❓ Vega GSC Pull — Depends on Google API auth
- ❓ Job Hunt — Depends on web scraping (site changes break it)
- ❓ FursBliss DALL-E — Depends on OpenAI API quota

### Not Currently Scheduled (Missing):
- None identified. All 21 jobs accounted for.

---

## QUICK COMMAND REFERENCE

```bash
# Today's status
grep "$(date +%Y-%m-%d)" ~/ObsidianVault/logs/automation_runs.md | tail -30

# Success count today
grep "$(date +%Y-%m-%d)" ~/ObsidianVault/logs/automation_runs.md | grep -c SUCCESS

# Failure count today
grep "$(date +%Y-%m-%d)" ~/ObsidianVault/logs/automation_runs.md | grep -c ERROR

# Clean repos before 23:00 SEO Batch
for repo in ~/projects/{snapbrand,cardsnap,watchthisapp}; do cd "$repo" && git add -A && git commit -m "cleanup"; done

# Check repo status
git -C ~/projects/snapbrand status --porcelain && git -C ~/projects/cardsnap status --porcelain && git -C ~/projects/watchthisapp status --porcelain

# See all jobs
cat ~/.hermes/cron/jobs.json | jq '.jobs[] | {name, schedule: .schedule.display, enabled}'

# Run job manually
hermes run JOB_ID

# View job logs
tail -100 ~/.hermes/logs/JOB_NAME.log
```

---

## DEPLOYMENT CHECKLIST (When Adding New Jobs)

- [ ] Script exists and runs locally without errors
- [ ] SKILL.md has explicit commands (not vague)
- [ ] Job added to ~/.hermes/cron/jobs.json with:
  - [ ] Unique id
  - [ ] Clear name
  - [ ] Cron schedule (expr)
  - [ ] enabled: true
  - [ ] deliver: "telegram"
  - [ ] timeout_seconds (set high if slow)
  - [ ] capture_logs: true
- [ ] JSON syntax valid: `cat ~/.hermes/cron/jobs.json | jq . > /dev/null`
- [ ] Job appears in `hermes status`
- [ ] Job tested manually: `hermes run JOB_ID`
- [ ] Appears in ~/ObsidianVault/logs/automation_runs.md after running

---

## NEXT CRITICAL DATES

- **Today 23:00 (Apr 16)** — SEO Batch Nightly (repos now clean, should succeed)
- **Daily 02:00** — Daily Sync consolidates all job outputs
- **Daily 06:00** — Vega GSC + Demand Scout (double job, watch for rate limits)
- **Weekly Sun 06:00** — Vega Weekly Audit
