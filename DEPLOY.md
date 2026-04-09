# Deployment Guide: Migrating to Fixed SEO Batch System

## Pre-Deployment Checklist

- [ ] Current system is running and producing pages
- [ ] Git repos (snapbrand, cardsnap, etc.) are clean (no uncommitted changes)
- [ ] Backup existing hermes_seo_system folder
- [ ] Test environment matches production (optional but recommended)

## Step 1: Backup

```bash
cd ~
cp -r hermes_seo_system hermes_seo_system.backup.$(date +%Y%m%d)
echo "Backed up to: hermes_seo_system.backup.$(date +%Y%m%d)"
```

## Step 2: Copy New Files

```bash
# Copy fixed scripts
cp seo_batch_fixed.py ~/hermes_seo_system/scripts/seo_batch.py
cp data_validators.py ~/hermes_seo_system/scripts/
cp deployment_health.py ~/hermes_seo_system/scripts/

# Backup old config, replace with new
cp ~/hermes_seo_system/projects.json ~/hermes_seo_system/projects.json.bak
cp projects_fixed.json ~/hermes_seo_system/projects.json
```

## Step 3: Review Config

Ensure projects.json has your correct settings:

```bash
cd ~/hermes_seo_system

# Check snapbrand
jq '.snapbrand' projects.json

# Check cardsnap
jq '.cardsnap' projects.json

# Check all enabled projects
jq '.[] | select(.enabled==true) | .enabled' projects.json
```

## Step 4: Test Single Project (No Health Checks)

Start with CardSnap since it has the most robust config:

```bash
cd ~/hermes_seo_system

# Test merge & build only (skip verification for speed)
python3 scripts/seo_batch.py --project cardsnap --skip-health-check
```

**Expected output:**
```
2026-04-08 15:23:45,234 [INFO] Loaded config: /Users/.../projects.json
2026-04-08 15:23:45,235 [INFO] Processing 1 projects
2026-04-08 15:23:45,236 [INFO] ============================================================
2026-04-08 15:23:45,237 [INFO] PROJECT: cardsnap
2026-04-08 15:23:45,238 [INFO] ============================================================
2026-04-08 15:23:45,239 [INFO] Lock acquired: cardsnap
2026-04-08 15:23:45,240 [INFO] Phase 1: Generator
2026-04-08 15:23:46,100 [INFO] Running: npm run generate:cardsnap:grade -- --max 50 --offset 0
...
2026-04-08 15:24:30,500 [INFO] Phase 3: Build
2026-04-08 15:24:30,501 [INFO] Running: npm run build
2026-04-08 15:24:45,600 [INFO] Build succeeded ✓
2026-04-08 15:24:45,601 [INFO] Phase 5: Commit & Push
...
2026-04-08 15:24:50,700 [INFO] ✓ cardsnap COMPLETE
2026-04-08 15:24:50,701 [INFO] SUCCESS: All projects processed
```

## Step 5: Verify Git

Check that commits have batch IDs:

```bash
cd ~/projects/cardsnap
git log --oneline | head -5

# Should show:
# a1b2c3d seo batch cardsnap [abc12345]  ← batch ID in brackets
# x9y8z7w seo batch cardsnap [xyz67890]
# ...
```

## Step 6: Full Test (With Health Checks)

```bash
cd ~/hermes_seo_system

# Test with live health checks
python3 scripts/seo_batch.py --project cardsnap
```

**Expected output:**
```
...
2026-04-08 15:25:00,500 [INFO] Phase 4: Health Check
2026-04-08 15:25:00,501 [INFO] Health Check: 2 pages
2026-04-08 15:25:01,100 [INFO]   https://cardsnap-seven.vercel.app/grade-or-skip/football → 200 (0.82s) ✓
2026-04-08 15:25:02,200 [INFO]   https://cardsnap-seven.vercel.app/grade-or-skip/yugioh → 200 (0.91s) ✓
2026-04-08 15:25:02,201 [INFO] Health Check Summary:
2026-04-08 15:25:02,202 [INFO]   Passed: 2/2
2026-04-08 15:25:02,203 [INFO]   Failed: 0/2
2026-04-08 15:25:02,204 [INFO]   Avg Response Time: 0.87s
...
```

If health checks fail, **do not proceed**. Investigate before continuing.

## Step 7: Test SnapBrand

```bash
cd ~/hermes_seo_system
python3 scripts/seo_batch.py --project snapbrand
```

Verify git commits and health checks.

## Step 8: Test All Projects

```bash
cd ~/hermes_seo_system
python3 scripts/seo_batch.py
```

Should process all enabled projects without failures. If any project fails, the entire batch exits with code 1.

## Step 9: Check Logs

```bash
# If using cron or systemd
tail -50 /var/log/syslog | grep seo_batch

# Or if using Hermes, check Hermes logs
hermes logs --name seo_batch

# Or just run with tee for log file
cd ~/hermes_seo_system
python3 scripts/seo_batch.py 2>&1 | tee batch_$(date +%Y%m%d_%H%M%S).log
```

## Step 10: Schedule with Hermes

Replace your existing Hermes schedule:

```bash
# Old schedule (if any):
hermes schedule --remove seo_batch

# New schedule:
hermes schedule --name seo_batch \
                --cron "0 2 * * *" \
                --cmd ~/hermes_seo_system/run_batch.sh \
                --timeout 3600
```

Or with cron:

```bash
# Add to crontab
crontab -e

# Add line:
0 2 * * * ~/hermes_seo_system/run_batch.sh 2>&1 | logger -t seo_batch
```

## Rollback (If Issues)

```bash
# Restore backup
rm -rf ~/hermes_seo_system
cp -r ~/hermes_seo_system.backup.20260408 ~/hermes_seo_system

# Restart scheduler
hermes restart  # or restart cron
```

## Troubleshooting

### Issue: "Lock failed: cardsnap (already running)"

**Cause:** Another instance is running
**Fix:**
```bash
# Check for stuck process
ps aux | grep seo_batch

# Kill if stuck (use cautiously)
pkill -f seo_batch
rm -f /tmp/seo_batch_locks/cardsnap.lock

# Retry
python3 scripts/seo_batch.py --project cardsnap
```

### Issue: "Build FAILED. Not committing."

**Cause:** Build returned non-zero
**Fix:**
```bash
# Debug the build manually
cd ~/projects/cardsnap
npm run build

# Fix issues, then retry
cd ~/hermes_seo_system
python3 scripts/seo_batch.py --project cardsnap
```

### Issue: "Item 0 missing required field: 'description'"

**Cause:** Generator output is incomplete
**Fix:**
```bash
# Check generator output
cat ~/projects/cardsnap/seo-engine/outputs/cardsnap/generated.json

# Verify generator is working
cd ~/projects/cardsnap/seo-engine
npm run generate:cardsnap:grade -- --max 5

# Check output has required fields
```

### Issue: "Page verification failed"

**Cause:** Pages don't render 200
**Fix:**
```bash
# Check page manually
curl -I https://cardsnap-seven.vercel.app/grade-or-skip/football

# If 404, check if build was actually deployed
# If 500, check Vercel logs
# If timeout, increase health check timeout in code
```

### Issue: "Repo has uncommitted changes"

**Cause:** Previous batch left dirty state
**Fix:**
```bash
# Check what's dirty
cd ~/projects/cardsnap
git status

# Resolve (stash, commit, or reset)
git stash
# or
git add . && git commit -m "manual cleanup"
# or
git reset --hard

# Retry batch
python3 scripts/seo_batch.py --project cardsnap
```

## Monitoring

Set up monitoring for batch runs:

### Email Alert on Failure

Add to run_batch.sh:

```bash
if [ $? -ne 0 ]; then
    echo "SEO batch failed at $(date)" | \
    mail -s "SEO Batch FAILURE" your-email@example.com
fi
```

### Slack Notification

```bash
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK"

if [ $? -ne 0 ]; then
    curl -X POST $WEBHOOK_URL \
        -d "{\"text\": \"SEO batch failed at $(date)\"}"
fi
```

### Metrics to Monitor

- **Batch duration**: Should be consistent (within ±10%)
- **Health check failures**: Should be 0
- **Git commit count**: Should match enabled projects
- **Lock timeouts**: Should be 0
- **Build failures**: Should be 0

Check metrics daily for first week, then weekly.

## Validation After Deploy

After running in production for 1 week:

- [ ] All batches completed successfully (check logs)
- [ ] No lock conflicts (check logs for "already running")
- [ ] No build failures (check logs for "Build FAILED")
- [ ] Health checks passing (check logs for "Passed: X/X")
- [ ] Pages indexing normally (check Google Search Console)
- [ ] No git conflicts (check git log for conflicts/merges)
- [ ] No data loss (compare item counts in project repos)

## Done

System is now ready for scaling to 50-500 pages per batch. Review FIXES_SUMMARY.md for list of improvements and BEFORE_AFTER.md for detailed changes.
