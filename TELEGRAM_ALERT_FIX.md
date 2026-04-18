# TELEGRAM ALERT FIXES

## 1. CardSnap Signal Hunter — FIX

**Problem:** Sends report location only (useless link)
**Solution:** Extract opportunities from report, send direct links

**Updated SKILL.md:**
```markdown
---
name: cardsnap-signal-hunter
description: Find sports card grading discussions with direct opportunity links for CardSnap
version: 2.0.0
---

# CardSnap Signal Hunter

Discovers sports card grading opportunities and sends actionable links to Telegram.

## Telegram Output Format (REQUIRED)

```
🎯 CardSnap Signal Hunter — 20 Opportunities Found

Top Opportunities:
🔗 [1] Baseball Card PSA Grade 10 Discussion — https://reddit.com/r/sportscard/...
🔗 [2] Grading Cost Comparison Thread — https://forums.psacard.com/...
🔗 [3] New Grader Certification — https://facebook.com/...

📊 Stats: 62 recent-dated, 8 new niches
🔗 Full Report: ~/ObsidianVault/cardsnap/cardsnap_signal_report_YYYYMMDD_HHMM.md
```

## What it does

- Searches for sports card grading discussions (Reddit, forums, public pages)
- **EXTRACTS DIRECT LINKS** to discussions (not just report location)
- Scores by relevance to grading keywords
- **Sends to Telegram with clickable URLs** (user can click directly)
- Saves markdown report to Obsidian
- Updates automation_runs.md

## Critical: Must Send These in Telegram

1. ✅ Direct URLs to opportunities (e.g., https://reddit.com/r/sportscard/...)
2. ✅ Opportunity title/context (e.g., "Baseball Card Grading Discussion")
3. ✅ Statistics (found X opportunities, Y recent-dated)
4. ❌ NOT just: "Report saved to [location]"

## Output

**Telegram:** Top 5-10 opportunities with direct links + stats
**Report:** ~/ObsidianVault/cardsnap/cardsnap_signal_report_YYYYMMDD_HHMM.md
**Log:** ~/ObsidianVault/logs/automation_runs.md
```

**Script Change Needed:**
In `cardsnap_signal_hunter.py`, change Telegram message from:
```python
# WRONG:
msg = f"Report: ~/ObsidianVault/cardsnap/cardsnap_signal_report_{timestamp}.md"

# CORRECT:
msg = f"""
🎯 CardSnap Signal Hunter — {len(opportunities)} Opportunities

{format_opportunities_with_links(opportunities)}

📊 Recent-dated: {recent_count}, New niches: {new_niches}
"""
```

---

## 2. Job Hunt (Morning/Afternoon/Evening) — FIX

**Problem:** Filters too heavily, sends 0-1 matches ("barely ever any results")
**Solution:** Relax filters, send top matching jobs with apply links

**Updated SKILL.md:**
```markdown
---
name: job-hunter
description: Find remote IT leadership jobs with direct application links
version: 2.0.0
---

# Job Hunter

Discovers remote IT Director/Manager positions and sends direct job links to Telegram.

## Telegram Output Format (REQUIRED)

```
💼 Job Hunt Morning — 3 Matches Found

🔗 [1] IT Director, Engineering — TechCorp (Remote) — $180k-$220k
   Apply: https://indeed.com/applystart?jobkey=abc123

🔗 [2] IT Manager, Infrastructure — StartupXYZ (Remote) — $130k-$160k
   Apply: https://indeed.com/applystart?jobkey=def456

🔗 [3] Senior IT Manager, Operations — BigCorp (Remote) — $200k-$250k
   Apply: https://indeed.com/applystart?jobkey=ghi789

📊 Checked: 200+ remote positions | Filters: Director/Manager/SysAdmin
```

## What it does

- Scans Indeed for remote IT Director/Manager/SysAdmin positions
- **Extracts direct application links** (not just job title)
- Removes DevOps/SRE noise
- **Sends top 3-5 matches to Telegram with clickable apply buttons**
- Tracks seen jobs to avoid duplicates

## Critical: Must Send These in Telegram

1. ✅ Job title + company name + salary range
2. ✅ Direct apply link (https://indeed.com/applystart?jobkey=...)
3. ✅ "Remote" confirmation
4. ✅ Number of jobs checked (to show effort)
5. ❌ NOT: "0 matches" (increase filter tolerance, send at least 1-2)

## Filters (RELAX THESE)

- ✅ Remote only
- ✅ Director, Manager, SysAdmin, Tech Lead
- ❌ DevOps, SRE, Cloud Engineer (filter out)
- ⚠️ If < 2 matches, lower seniority requirement and resend

## Output

**Telegram:** Top 3-5 jobs with apply links + salary
**Log:** ~/job_search/seen_jobs.json
**Automation log:** ~/ObsidianVault/logs/automation_runs.md
```

**Script Change:**
```python
# WRONG (too strict):
if "director" in title or "manager" in title:
    # Only 0-1 match per day

# CORRECT (broader):
if any(role in title.lower() for role in ["director", "manager", "sysadmin", "lead", "supervisor"]):
    # Send top 3-5 matches

# ALWAYS send at least 1, even if low confidence
if not matches and total_jobs_scanned > 100:
    matches = [top_relevance_job]  # Send best attempt
```

---

## 3. Demand Scout — FIX

**Problem:** Only 1 result per day (low volume)
**Solution:** Send top 3 ranked opportunities instead of 1

**Updated SKILL.md:**
```markdown
---
name: demand-scout
description: Discover high-demand market opportunities from multiple sources
version: 2.0.0
---

# Demand Scout

Discovers emerging market opportunities and sends top results to Telegram with context links.

## Telegram Output Format (REQUIRED)

```
📊 Demand Scout Results — 3 Top Opportunities

[Today 06:00 AM]

🔥 [1] AI-Powered Code Review Tools
   Source: HackerNews #1 trending
   Context: Show HN: Automated code review for teams
   🔗 https://news.ycombinator.com/item?id=12345

📈 [2] No-Code Data Pipeline Builder
   Source: Reddit r/startups (62 upvotes)
   Context: "I built a tool to avoid Zapier/Make costs"
   🔗 https://reddit.com/r/startups/comments/abc123

💡 [3] Real-Time Collaboration SDK
   Source: Techmeme (mentioned 2 sources)
   Context: "CR+L collaboration gaining traction"
   🔗 https://techmeme.com/...

📋 Total raw: 47 sources scanned | Unique ranked: 3 | Confidence: High
```

## What it does

- Scrapes HackerNews (Firebase API), Reddit, Techmeme
- Ranks opportunities by engagement + trending signals
- **Sends TOP 3 opportunities with direct source links**
- Each result includes: context + link user can click immediately
- Deduplicates across sources

## Critical: Must Send These in Telegram

1. ✅ Opportunity title (what problem it solves)
2. ✅ Source (HN, Reddit, Techmeme) + engagement signal (trending, upvotes)
3. ✅ Brief context (1 sentence explaining why it matters)
4. ✅ Direct link user can click now
5. ✅ Stats: "X sources scanned, Y ranked"
6. ❌ NOT: "Only 1 result found"

## Output

**Telegram:** Top 3 opportunities with clickable source links + context
**Vault:** ~/ObsidianVault/demand_scout/opportunities.md
**Log:** ~/ObsidianVault/logs/automation_runs.md
```

**Script Change:**
```python
# WRONG:
opportunities = rank_all_sources()
top_1 = opportunities[0]
send_telegram(f"Found: {top_1.title}")

# CORRECT:
opportunities = rank_all_sources()
top_3 = opportunities[:3]
for opp in top_3:
    telegram_msg += f"""
🔥 [{opp.rank}] {opp.title}
Source: {opp.source} ({opp.signal})
Context: {opp.context}
🔗 {opp.direct_link}
"""
```

---

## DEPLOYMENT ORDER

1. **Update SKILL.md files** (above)
2. **Modify scripts** to send formatted Telegram messages
3. **Test each job manually:**
   ```bash
   python3 ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
   python3 ~/.hermes/skills/job-hunter/scripts/hunt.py
   python3 ~/.hermes/skills/research/demand-scout/demand_scout.py
   ```
4. **Verify Telegram messages** contain direct links
5. **Schedule next run** and monitor

---

## MONITORING

After fix, user should receive:
- **CardSnap Signal Hunter:** 20 opportunities with 5-10 direct Reddit/forum/Facebook links ✓
- **Job Hunt (3x):** 3-5 jobs with apply links every run ✓
- **Demand Scout:** 3 top opportunities with HN/Reddit/Techmeme links ✓
- **All others:** Formatted alerts with metrics ✓
