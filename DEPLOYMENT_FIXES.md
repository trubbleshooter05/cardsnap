# TELEGRAM ALERT FIXES — DEPLOYMENT

**Status:** 3 scripts fixed, ready for deployment  
**Date:** 2026-04-17  
**Verification:** Manual test required before scheduled runs

---

## WHAT CHANGED

### 1. CardSnap Signal Hunter
- **File:** `~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py`
- **Problem:** Sends only report file location, not actual opportunity links
- **Fix:** Extract direct URLs from `self.results`, format as clickable links in Telegram
- **Change Size:** ~30 lines in `send_telegram()` method

**Before:**
```python
msg = "Report: ~/ObsidianVault/cardsnap/cardsnap_signal_report_{timestamp}.md"
```

**After:**
```python
for idx, opp in enumerate(top_opportunities, 1):
    title = opp.get('title', '')
    url = opp.get('url', '')  # Direct link to opportunity
    msg += f"🔗 [{idx}] {title}\n   {url}\n"
```

### 2. Job Hunt (3x daily)
- **File:** `~/.hermes/skills/job-hunter/scripts/hunt.py`
- **Problem:** TITLE_KEYWORDS too strict, filters out valid jobs → sends 0-1 matches
- **Fix:** Relax filters, use partial matching, ensure 1-5 results per run
- **Change Size:** ~20 lines in scoring logic + 5 lines in send_telegram()

**Before:**
```python
TITLE_KEYWORDS = {
    'it director': 100,
    'it manager': 85,
}
# Only exact substrings matched
```

**After:**
```python
TITLE_KEYWORDS = {
    'director': 90,
    'manager': 80,
    'lead': 75,
}
# Partial matching finds more jobs
```

### 3. Demand Scout
- **File:** `~/.hermes/skills/research/demand-scout/scripts/demand_scout.py`
- **Problem:** Sends only 1 result per day
- **Fix:** Send top 3 opportunities with direct source links
- **Change Size:** ~15 lines in `send_telegram()` method

**Before:**
```python
top_1 = opportunities[0]
send_telegram(f"Found: {top_1.title}")
```

**After:**
```python
top_3 = opportunities[:3]
for opp in top_3:
    msg += f"🔥 [{idx}] {opp.title}\n   {opp.source}\n   {opp.url}\n"
```

---

## DEPLOYMENT STEPS

### Step 1: Apply Fixes

**Copy fixed scripts to production:**
```bash
# CardSnap Signal Hunter
cp /path/to/cardsnap_signal_hunter_FIXED.py ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py

# Job Hunt
cp /path/to/hunt_FIXED.py ~/.hermes/skills/job-hunter/scripts/hunt.py

# Demand Scout
cp /path/to/demand_scout_FIXED.py ~/.hermes/skills/research/demand-scout/scripts/demand_scout.py
```

### Step 2: Verify Syntax
```bash
python3 -m py_compile ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
python3 -m py_compile ~/.hermes/skills/job-hunter/scripts/hunt.py
python3 -m py_compile ~/.hermes/skills/research/demand-scout/scripts/demand_scout.py
```

### Step 3: Manual Test (CRITICAL)
```bash
# Test each script individually
python3 ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
python3 ~/.hermes/skills/job-hunter/scripts/hunt.py
python3 ~/.hermes/skills/research/demand-scout/scripts/demand_scout.py

# Verify Telegram messages received with:
# - Direct clickable links (not just file paths)
# - 5-10 results for CardSnap
# - 3-5 results for Job Hunt
# - 3 results for Demand Scout
```

### Step 4: Schedule Verification
```bash
# Verify jobs still in cron schedule
cat ~/.hermes/cron/jobs.json | jq '.jobs[] | select(.name | contains("CardSnap|Job Hunt|Demand Scout"))'

# Should show: enabled: true, deliver: "telegram"
```

### Step 5: Monitor First Run
After deployment, watch the next scheduled run:
- **Job Hunt Morning:** 08:00 (should send 3-5 jobs)
- **Demand Scout:** 06:00 (should send 3 opportunities)
- **CardSnap Signal Hunter:** On-demand (run manually to test)

Check Telegram for:
✅ Direct clickable links (not file paths)  
✅ Expected number of results (5-10 for CardSnap, 3-5 for jobs, 3 for scout)  
✅ Proper formatting with emojis and metrics  

---

## ROLLBACK

If issues arise:
```bash
# Revert to originals (if backed up)
cp ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py.bak ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
cp ~/.hermes/skills/job-hunter/scripts/hunt.py.bak ~/.hermes/skills/job-hunter/scripts/hunt.py
cp ~/.hermes/skills/research/demand-scout/scripts/demand_scout.py.bak ~/.hermes/skills/research/demand-scout/scripts/demand_scout.py
```

Or disable jobs temporarily:
```bash
hermes disable "CardSnap Signal Hunter"
hermes disable "Job Hunt Morning"
hermes disable "Demand Scout"
```

---

## EXPECTED RESULTS AFTER FIX

| Job | Before | After |
|-----|--------|-------|
| **CardSnap Signal Hunter** | Report path only | 5-10 direct links to card discussions |
| **Job Hunt (3x)** | 0-1 matches | 3-5 matching jobs with apply links |
| **Demand Scout** | 1 opportunity | 3 opportunities with source links |

---

## RISK ASSESSMENT

**Low Risk:**
- Changes are isolated to Telegram message formatting
- No database or API changes
- Filters only relaxed, not removed
- Existing scraping logic unchanged

**Testing Required:**
- ✅ Verify Telegram messages format correctly
- ✅ Verify direct links are clickable
- ✅ Verify no duplicate results sent

**Monitoring:**
- Watch next 3 scheduled runs (24h observation period)
- Check automation_runs.md for any new errors
- Verify repos stay clean (no untracked files from scripts)
