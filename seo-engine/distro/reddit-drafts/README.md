# Reddit Drafts — Manual Post Only

**STATUS: DRAFT_ONLY — No Reddit API approval yet.**

These files are hand-crafted post drafts for Reddit. They must be posted manually.
Do NOT build any automation that posts to Reddit until API approval is confirmed.

## How to Use

1. Open the draft file for the target subreddit
2. Review and edit as needed for the current moment/context
3. Log into Reddit manually
4. Post to the subreddit
5. Update `distro/backlink-queue.json` to mark status as `submitted`

## Approved Read-Only Operations (No API Required)

The following are safe without API approval:
- Reading public Reddit JSON endpoints: `https://reddit.com/r/[subreddit].json`
- Scraping public post titles for keyword research
- Manually reading subreddits for content ideas

## Blocked Until API Approval

- Auto-posting
- Commenting via script
- OAuth authentication flows
- Any write operation via API

## Draft Files

See `cardsnap-grading-calculator.md` and `fursbliss-walks-left.md` for ready-to-post drafts.
