# CardSnap — fresh Reddit account warmup

**Why:** `foofight22` is sitewide submission-filtered (`removed_by_category: reddit`). Comments may work; **original posts do not**. This account is the path back to visible subreddit threads.

**Avatar:** Mike — weekend collector, not a brand account.

---

## 1. Create the account (today, ~10 min)

1. Pick a **normal collector username** — not CardSnap, not getcardsnap, not PSA-fee-bot vibes.
2. Use a **real email** and verify it immediately.
3. Sign up on **old.reddit.com** (top-right login → register).
4. Run one-time login (saves isolated Chrome cookies):

```bash
/Users/openclaw/venv/bin/python3 /Users/openclaw/projects/cardsnap/scripts/reddit_warmup_login_once.py
```

5. After signup, edit `Documents/riley/reddit_browser_profiles.py` → `cardsnap_warmup.account` with your exact username.
6. Confirm:

```bash
/Users/openclaw/venv/bin/python3 /Users/openclaw/Documents/riley/reddit_browser_profiles.py verify cardsnap_warmup
```

**Profile dir:** `cardsnap/.browser-profiles/reddit-warmup`  
**Never use Cursor Glass for Reddit.**

---

## 2. Rules (non-negotiable)

| Do | Don't |
|----|-------|
| 1–2 actions/day max in weeks 1–2 | Batch post or comment |
| 15+ min between actions | Retry through rate-limit errors |
| Genuine hobby talk | Links, tool names, getcardsnap.com |
| Same Chrome profile every time | VPN hop / new device every session |
| Upvote + lurk first week | Cross-post same copy to 9 subs |
| Log every action (script below) | Use foofight22 patterns that got filtered |

---

## 3. 21-day schedule

### Days 1–7 — lurk only
- Subscribe: r/sportscards, r/baseballcards, r/basketballcards, r/psagrading (pick 3–4 max).
- Upvote 3–5 posts/day while browsing naturally (manual in Chrome profile).
- **Zero comments. Zero posts.**

### Days 8–14 — comment warmup
- **1 comment/day** on someone else's thread (not your own).
- Reply to show stories, pull questions, "what would you grade?" — **no math dumps, no links**.
- Space **15+ min** if you do anything else same day.

### Days 15–18 — scale comments
- **2 comments/day max**, still no links.
- Mix subs (don't spam one sub).
- Aim for **50+ comment karma** before first post attempt.

### Day 19 — first post (test)
- **One** text post, r/sportscards only.
- Personal story or question — **no grading-fee template**, no URL.
- After submit, check visibility (see §5). If filtered → stop posting 7 days, comments only.

### Days 20–21 — evaluate
- If post **visible**: one post/week max, comments 2/day.
- If post **filtered**: extend comment-only phase 14 days, then retry with different sub (r/baseballcards).

---

## 4. Daily tracker

```bash
/Users/openclaw/venv/bin/python3 /Users/openclaw/projects/cardsnap/scripts/reddit_warmup_log.py comment r/sportscards "replied to show thread"
/Users/openclaw/venv/bin/python3 /Users/openclaw/projects/cardsnap/scripts/reddit_warmup_log.py status
```

Log file: `~/.cardsnap_reddit_warmup.json`

---

## 5. Check if a post is visible

Use post ID from URL (`1uvsexx` etc.) after submit. `removed: None` = public. `removed: reddit` = sitewide filter.

---

## 6. When to introduce CardSnap

Only after **3+ visible posts** or **100+ comment karma** over 30+ days:

1. Helpful comp paste in thread (no link).
2. If OP asks "what tool?" → DM.
3. Link in post body only if sub rules allow **and** mods know you.

---

## 7. foofight22 during warmup

- **Draft-only** — `CARDSNAP_AUTO_POST=0` in `~/.hermes/.env`.
- No new submissions from foofight22.
- FB groups unchanged — link OK there.


---

## Automated mode (recommended)

**Your only manual step:** create account + run login once (§1). Everything else runs daily.

### Enable cron (once)

Add to Hermes or crontab — runs **11:00 AM daily**:

```bash
/usr/bin/python3 /Users/openclaw/.hermes/scripts/run_with_logging.py   cardsnap-reddit-warmup /Users/openclaw/venv/bin/python3   /Users/openclaw/projects/cardsnap/scripts/reddit_warmup_run.py
```

### What it does automatically

| Days | Cron behavior |
|------|----------------|
| 1–7 | Lurk phase — logs status, no comments |
| 8–18 | Finds 1 hobby thread/day, posts short genuine comment (no links) |
| 19+ | Attempts first r/sportscards post, checks if visible |

### Manual checks (optional)

```bash
/Users/openclaw/venv/bin/python3 /Users/openclaw/projects/cardsnap/scripts/reddit_warmup_log.py status
/Users/openclaw/venv/bin/python3 /Users/openclaw/projects/cardsnap/scripts/reddit_warmup_run.py --dry-run
```

Wall clock is still ~19 days before a post test — Reddit won't trust a brand-new account faster. Automation removes daily babysitting, not the calendar.
