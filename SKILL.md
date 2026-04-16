---
name: cardsnap-signal-hunter
description: Discover public web opportunities for CardSnap promotion by finding sports card grading discussions and generating targeted copy
version: 1.0.0
trigger: cardsnap-signal-hunter
env_required: []
env_optional:
  - TELEGRAM_BOT_TOKEN
  - TELEGRAM_CHAT_ID
---

# CardSnap Signal Hunter

Autonomous skill to discover public web opportunities for promoting CardSnap within sports card grading discussions.

## What it does

- Searches public web for sports card grading discussions (Reddit, forums, public Facebook pages)
- Extracts relevant URLs from search results (no login required, no Meta API)
- Scores results by relevance to grading-related keywords
- Generates 1-2 non-spammy suggested replies for manual posting
- Saves markdown report to Obsidian vault
- Logs run activity to automation_runs.md
- Optionally sends summary to Telegram

## How it works

1. Executes targeted search queries via DuckDuckGo/Bing
2. Parses HTML results and extracts URLs
3. Deduplicates and scores by keyword relevance
4. Generates helpful, non-promotional copy suggestions
5. Saves structured report to `~/ObsidianVault/cardsnap/cardsnap_signal_report_YYYYMMDD_HHMM.md`
6. Updates opportunity inbox and run log

## Triggers

Manual: `cardsnap-signal-hunter`

## Files created

- `~/.hermes/skills/cardsnap-signal-hunter/SKILL.md` (this file)
- `~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py`
- `~/.hermes/skills/cardsnap-signal-hunter/scripts/requirements.txt`

## Environment variables (optional)

```bash
export TELEGRAM_BOT_TOKEN="your_token_here"
export TELEGRAM_CHAT_ID="your_chat_id_here"
```

If not set, skill still completes with Obsidian report.

## Manual execution

```bash
python3 ~/.hermes/skills/cardsnap-signal-hunter/scripts/cardsnap_signal_hunter.py
```

## Output

- Primary: `~/ObsidianVault/cardsnap/cardsnap_signal_report_YYYYMMDD_HHMM.md`
- Log entry: `~/ObsidianVault/logs/automation_runs.md`
- Optional: Telegram message with top 5 results
- Optional: Updated `~/ObsidianVault/cardsnap/opportunity_inbox.md`

## Notes

- No Facebook login required
- No Meta API required
- Uses only public search results
- Respects robots.txt and rate limits
- All URLs must be publicly accessible
