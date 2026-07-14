#!/usr/bin/env python3
"""Daily Reddit warmup automation for cardsnap_warmup account."""
from __future__ import annotations

import json
import random
import re
import sys
import time
from datetime import date, datetime, timezone
from pathlib import Path

import requests

RILEY = Path("/Users/openclaw/Documents/riley")
sys.path.insert(0, str(RILEY))

from reddit_browser_profiles import PROJECTS, UA, cookies_to_jar, load_profile_cookies, verify_via_api
from reddit_post_comment import post_comment
from reddit_submit_post import submit_text_post
from reddit_warmup_log import cmd_log, day_offset, limit_for_day, load, today_actions

PROJECT = "cardsnap_warmup"
SEEN = Path.home() / ".cardsnap_reddit_warmup_seen.json"
UA_LIST = {"User-Agent": UA}

SUBS = ["sportscards", "baseballcards", "basketballcards", "psagrading"]

SHOW = re.compile(r"\b(show|haul|pickup|picked up|lcs|vendor|rip|break)\b", re.I)
GRADE = re.compile(r"\b(grade|grading|psa|bgs|sgc|center|centering|submit|send in)\b", re.I)
SKIP = re.compile(r"\b(giveaway|referral|discord|promo|for sale|fs/ft|wtb)\b", re.I)

TEMPLATES = {
    "show": [
        "Nice haul. Mid-tier rookies feel soft right now so holding a few raw is probably smart.",
        "Good mix. I spent more time talking to vendors than buying at my last show too.",
        "Solid pickup. Shows are dangerous when you bring a submit pile and no plan.",
    ],
    "grade": [
        "Hard to call from photos but centering looks like the swing. Corners seem okay from what I can see.",
        "I'd comp the exact parallel sold raw before sending — a lot of these only move at gem.",
        "If the back corners are clean under a loupe I'd lean send. Surface scuffs kill a lot of modern.",
    ],
    "general": [
        "Same experience here — took way too long to stop sending everything in blindly.",
        "Market feels weird on these. Raw might be the move unless you're confident on a 10.",
        "I've had better luck selling raw and rebuying slabs than chasing grades on mid stuff.",
    ],
}

FIRST_POST = (
    "Regional show last month — bought less than I planned",
    "Went expecting to load up. Mostly ended up talking vendors out of grading half my stack. "
    "One honest loupe read saved me a batch fee. Anyone else change their submit habits after a show?",
)


def load_seen() -> set[str]:
    if SEEN.exists():
        return set(json.loads(SEEN.read_text()))
    return set()


def save_seen(seen: set[str]) -> None:
    SEEN.parent.mkdir(parents=True, exist_ok=True)
    SEEN.write_text(json.dumps(sorted(seen)))


def account_ready() -> bool:
    acct = PROJECTS.get(PROJECT, {}).get("account", "")
    return bool(acct) and acct != "SET_AFTER_SIGNUP"


def fetch_new(sub: str, limit: int = 25) -> list[dict]:
    r = requests.get(
        f"https://old.reddit.com/r/{sub}/new.json?limit={limit}",
        headers=UA_LIST,
        timeout=30,
    )
    r.raise_for_status()
    out = []
    for c in r.json().get("data", {}).get("children", []):
        d = c.get("data") or {}
        if d.get("stickied") or not d.get("is_self"):
            continue
        if SKIP.search(d.get("title", "") + " " + (d.get("selftext") or "")[:200]):
            continue
        out.append(d)
    return out


def pick_thread(seen: set[str]) -> tuple[str, str, str] | None:
    """Return (url, category, title) or None."""
    candidates: list[tuple[int, str, str, str]] = []
    for sub in SUBS:
        for d in fetch_new(sub):
            pid = d.get("id")
            if not pid or pid in seen:
                continue
            title = d.get("title") or ""
            body = (d.get("selftext") or "")[:300]
            text = f"{title} {body}"
            if d.get("over_18"):
                continue
            if d.get("num_comments", 0) > 40:
                continue
            score = int(d.get("score") or 0)
            if score > 80:
                continue
            cat = "show" if SHOW.search(text) else "grade" if GRADE.search(text) else "general"
            url = "https://old.reddit.com" + (d.get("permalink") or "")
            # prefer fresh threads with some activity
            rank = score + d.get("num_comments", 0) * 2
            candidates.append((rank, url, cat, title))
        time.sleep(1.2)
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0], reverse=True)
    _, url, cat, title = random.choice(candidates[:8])
    return url, cat, title


def already_commented(url: str) -> bool:
    try:
        verify_via_api(PROJECT)
        jar = cookies_to_jar(load_profile_cookies(PROJECT))
        r = requests.get(url.rstrip("/") + ".json", cookies=jar, headers=UA_LIST, timeout=30)
        if r.status_code != 200:
            return False
        user = PROJECTS[PROJECT]["account"].lower()
        return user in r.text.lower()
    except Exception:
        return False


def post_visible(slug: str) -> bool:
    try:
        jar = cookies_to_jar(load_profile_cookies(PROJECT))
        r = requests.get(f"https://old.reddit.com/comments/{slug}.json", cookies=jar, headers=UA_LIST, timeout=30)
        d = r.json()[0]["data"]["children"][0]["data"]
        return not d.get("removed_by_category")
    except Exception:
        return False


def run(*, dry_run: bool = False) -> int:
    if not account_ready():
        print("[WARMUP] Set cardsnap_warmup.account in reddit_browser_profiles.py after signup.")
        print("[WARMUP] Then run: reddit_warmup_login_once.py")
        return 0

    data = load()
    offset = day_offset(data)
    cap, phase = limit_for_day(offset)
    today = today_actions(data)
    comments_today = sum(1 for a in today if a["kind"] == "comment")
    posts_today = sum(1 for a in today if a["kind"] == "post")

    print(f"[WARMUP] day {offset + 1} | {phase} | comments {comments_today}/{cap}")

    # Day 19+ first post attempt (once per week max)
    if offset >= 18 and posts_today == 0:
        week_posts = [a for a in data.get("actions", []) if a["kind"] == "post"]
        if len(week_posts) == 0 or offset == 18:
            title, body = FIRST_POST
            if dry_run:
                print(f"[WARMUP] DRY RUN post r/sportscards: {title}")
                return 0
            try:
                url = submit_text_post(PROJECT, "sportscards", title, body, skip_duplicate=True)
                if url and url not in ("duplicate", "dry_run"):
                    slug = url.rstrip("/").split("/")[-1]
                    visible = post_visible(slug)
                    cmd_log("post", f"r/sportscards {slug} visible={visible}")
                    print(f"[WARMUP] post {url} visible={visible}")
            except Exception as e:
                print(f"[WARMUP] post failed: {e}")
            return 0

    if offset < 7:
        print("[WARMUP] lurk phase — no comments (cron OK)")
        return 0

    if comments_today >= cap:
        print("[WARMUP] daily comment cap reached")
        return 0

    seen = load_seen()
    picked = pick_thread(seen)
    if not picked:
        print("[WARMUP] no suitable thread today")
        return 0

    url, cat, title = picked
    if already_commented(url):
        seen.add(url.split("/")[-2] if url.endswith("/") else url.split("/")[-1])
        save_seen(seen)
        print(f"[WARMUP] already on thread: {url}")
        return 0

    comment = random.choice(TEMPLATES[cat])
    print(f"[WARMUP] target r/{url.split('/r/')[1].split('/')[0]} | {title[:60]}")
    if dry_run:
        print(f"[WARMUP] DRY RUN comment: {comment}")
        return 0

    ok = post_comment(PROJECT, url, comment, duplicate_needle=comment[:30])
    if ok:
        pid = re.search(r"/comments/([a-z0-9]+)", url)
        if pid:
            seen.add(pid.group(1))
            save_seen(seen)
        cmd_log("comment", f"{url} | {title[:40]}")
        print("[WARMUP] comment posted")
    else:
        print("[WARMUP] comment failed")
    return 0 if ok else 1


def main() -> int:
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()
    return run(dry_run=args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
