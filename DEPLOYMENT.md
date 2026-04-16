# CardSnap Signal Hunter - Deployment Instructions

## File Placement

Copy the files to your Hermes skills directory:

```bash
# Create skill directory
mkdir -p ~/.hermes/skills/cardsnap-signal-hunter/scripts

# Copy files
cp SKILL.md ~/.hermes/skills/cardsnap-signal-hunter/
cp cardsnap_signal_hunter.py ~/.hermes/skills/cardsnap-signal-hunter/scripts/
cp requirements.txt ~/.hermes/skills/cardsnap-signal-hunter/scripts/

# Make executable
chmod +x ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
```

## Install Dependencies

```bash
pip install -r ~/.hermes/skills/cardsnap-signal-hunter/scripts/requirements.txt
```

## Directory Structure

```
~/.hermes/skills/cardsnap-signal-hunter/
├── SKILL.md
└── scripts/
    ├── cardsnap_signal_hunter.py
    └── requirements.txt

~/ObsidianVault/
├── cardsnap/
│   ├── cardsnap_signal_report_YYYYMMDD_HHMM.md (generated)
│   └── opportunity_inbox.md (generated/updated)
└── logs/
    └── automation_runs.md (updated with run log)
```

## Manual Test

Run once to verify setup:

```bash
python3 ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
```

Expected output:
- Searches 12 queries
- Finds 20-50 URLs
- Generates report in `~/ObsidianVault/cardsnap/cardsnap_signal_report_YYYYMMDD_HHMM.md`
- Updates `~/ObsidianVault/logs/automation_runs.md`
- Updates `~/ObsidianVault/cardsnap/opportunity_inbox.md`

## Optional: Telegram Setup

Add to your shell environment:

```bash
export TELEGRAM_BOT_TOKEN="your_bot_token_here"
export TELEGRAM_CHAT_ID="your_chat_id_here"
```

Or add to `~/.bashrc` or `~/.zshrc` to persist.

If not set, skill still generates full reports - Telegram is optional.

## Add to Hermes Cron Jobs

Edit `~/.hermes/cron/jobs.json` and add this entry:

```json
{
  "id": "cardsnap-signal-hunter",
  "name": "CardSnap Signal Hunter",
  "enabled": true,
  "schedule": "0 9 * * 1,3,5",
  "command": "python3 /Users/YOUR_USERNAME/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py",
  "timeout": 300,
  "description": "Find public web opportunities for CardSnap promotion in sports card grading discussions"
}
```

**Schedule explanation:**
- `0 9 * * 1,3,5` = Mon/Wed/Fri at 9 AM
- To run daily: `0 9 * * *`
- To run weekly: `0 9 * * 1` (Monday only)

## Monitoring

After first run, check:

1. **Report generation:**
   ```bash
   ls -la ~/ObsidianVault/cardsnap/cardsnap_signal_report_*.md
   ```

2. **Run logs:**
   ```bash
   tail ~/ObsidianVault/logs/automation_runs.md
   ```

3. **Opportunity inbox:**
   ```bash
   cat ~/ObsidianVault/cardsnap/opportunity_inbox.md
   ```

## How It Works

1. **Search:** 12 targeted queries across Reddit, Facebook, forums
2. **Extract:** Parses HTML to find public URLs (no API, no login)
3. **Score:** Rates results by grading keyword relevance
4. **Generate:** Creates 1-2 non-spammy reply suggestions per URL
5. **Report:** Saves structured markdown with top 20 opportunities
6. **Log:** Adds run entry to Obsidian automation log
7. **Notify:** Sends summary to Telegram (if configured)

## Customization

### Change Search Queries

Edit `SEARCH_QUERIES` in `cardsnap_signal_hunter.py`:

```python
SEARCH_QUERIES = [
    'site:reddit.com/r/pokemontcg "worth grading"',
    'your custom query here',
    # ...
]
```

### Adjust Relevance Keywords

Edit `GRADING_KEYWORDS` in `cardsnap_signal_hunter.py`:

```python
GRADING_KEYWORDS = [
    'your keyword here',
    'another keyword',
    # ...
]
```

### Change Report Limit

Modify in `SignalHunter.run()`:

```python
self.results = scored_results[:30]  # Top 30 instead of 20
```

## Troubleshooting

**No results found:**
- Check internet connection
- Try manual run: `python3 ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py`
- Check for rate limiting from search engines

**Missing directories:**
```bash
mkdir -p ~/ObsidianVault/cardsnap ~/ObsidianVault/logs
```

**Import errors:**
```bash
pip install requests beautifulsoup4
```

**Telegram not sending:**
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set
- Skill still completes if Telegram fails - it's optional

## Notes

- Script respects HTTP timeouts (10s per request)
- Deduplicates URLs automatically
- Safe, non-aggressive scraping (public search results only)
- No login/API required
- No browser automation
- All copy suggestions are helper-tone, not promotional
