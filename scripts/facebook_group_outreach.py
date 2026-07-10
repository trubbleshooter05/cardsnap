#!/usr/bin/env python3
"""Find grade-intent posts in CardSnap FB groups and reply via isolated Chrome."""

from __future__ import annotations

import re
import sys

sys.path.insert(0, "/Users/openclaw/Documents/riley")
from facebook_browser_profiles import facebook_browser, verify_session

GROUPS = [
    ("FB Pokémon Hub", "4042133712737949"),
    ("FB Sports Cards Nonsense", "405077410476933"),
    ("FB Sports Card Collectors forum", "1412409369011598"),
    ("FB Sports Cards & Collectibles", "6585675648140607"),
]

SEARCH = "worth grading"
MAX_POSTS = 1

REPLY = (
    "Before you pay fees compare raw sold vs PSA 9 vs PSA 10 on the exact card. "
    "If only a 10 clears fees it is a borderline submit. "
    "I run that math on getcardsnap.com by typing the card name and condition. "
    "Share set and number if you want a second opinion."
)

GRADE_RE = re.compile(r"worth grad|should i grade|grade or sell|worth getting graded", re.I)


def extract_post_ids(html: str, limit: int = 6) -> list[str]:
    return list(dict.fromkeys(re.findall(r'"post_id":"(\d+)"', html)))[:limit]


def comment_on_post(page, group_id: str, post_id: str) -> bool:
    url = f"https://www.facebook.com/groups/{group_id}/posts/{post_id}/"
    page.goto(url, wait_until="domcontentloaded", timeout=90000)
    page.wait_for_timeout(5000)
    if "getcardsnap.com" in page.content().lower():
        print(f"Skip already replied: {url}")
        return False
    body = page.inner_text("body")
    if not GRADE_RE.search(body):
        print(f"Skip not grade-intent: {post_id}")
        return False
    box = page.locator('div[role="textbox"][contenteditable="true"]').last
    if not box.count():
        print(f"No comment box: {post_id}")
        return False
    box.click()
    page.keyboard.type(REPLY, delay=2)
    page.wait_for_timeout(400)
    submit = page.get_by_role("button", name=re.compile(r"^Comment$|^Post$", re.I))
    if submit.count():
        submit.last.click()
    else:
        page.keyboard.press("Enter")
    page.wait_for_timeout(8000)
    ok = "getcardsnap.com" in page.content().lower()
    print(f"Posted={ok} {url}")
    return ok


def main() -> int:
    verify_session("cardsnap")
    posted: list[tuple[str, str]] = []
    for group_name, group_id in GROUPS:
        if len(posted) >= MAX_POSTS:
            break
        search_url = f"https://www.facebook.com/groups/{group_id}/search/?q={SEARCH.replace(' ', '%20')}"
        print(f"Searching {group_name}…")
        with facebook_browser("cardsnap", search_url) as (_ctx, page):
            page.set_viewport_size({"width": 1400, "height": 900})
            page.wait_for_timeout(10000)
            for post_id in extract_post_ids(page.content()):
                if len(posted) >= MAX_POSTS:
                    break
                if comment_on_post(page, group_id, post_id):
                    posted.append((group_name, post_id))
                    break
    print("SUMMARY", posted)
    return 0 if posted else 1


if __name__ == "__main__":
    sys.exit(main())
