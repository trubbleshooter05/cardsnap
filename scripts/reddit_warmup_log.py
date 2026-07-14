#!/usr/bin/env python3
"""Track warmup account daily actions — stay under Reddit limits."""
from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timezone
from pathlib import Path

LOG = Path.home() / ".cardsnap_reddit_warmup.json"

PHASE_LIMITS: list[tuple[int, int, str]] = [
    (0, 0, "lurk only — upvotes OK, no comments/posts"),
    (7, 1, "max 1 comment/day"),
    (14, 2, "max 2 comments/day"),
    (18, 1, "max 1 post attempt in phase; 2 comments/day"),
    (21, 2, "max 1 post/week + 2 comments/day"),
]


def load() -> dict:
    if LOG.exists():
        return json.loads(LOG.read_text())
    return {"start_date": date.today().isoformat(), "actions": []}


def save(data: dict) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text(json.dumps(data, indent=2))


def day_offset(data: dict) -> int:
    start = date.fromisoformat(data["start_date"])
    return (date.today() - start).days


def limit_for_day(offset: int) -> tuple[int, str]:
    comment_cap = 0
    note = PHASE_LIMITS[0][2]
    for start, cap, desc in PHASE_LIMITS:
        if offset >= start:
            comment_cap = cap
            note = desc
    return comment_cap, note


def today_actions(data: dict) -> list[dict]:
    today = date.today().isoformat()
    return [a for a in data.get("actions", []) if a.get("date") == today]


def cmd_log(kind: str, detail: str) -> None:
    data = load()
    data.setdefault("actions", []).append(
        {
            "date": date.today().isoformat(),
            "ts": datetime.now(timezone.utc).isoformat(),
            "kind": kind,
            "detail": detail,
        }
    )
    save(data)
    print(f"Logged {kind}: {detail}")


def cmd_status() -> None:
    data = load()
    offset = day_offset(data)
    cap, note = limit_for_day(offset)
    today = today_actions(data)
    comments = sum(1 for a in today if a["kind"] == "comment")
    posts = sum(1 for a in today if a["kind"] == "post")
    print(f"Warmup day {offset + 1} (start {data['start_date']})")
    print(f"Phase: {note}")
    print(f"Today: {comments} comments, {posts} posts (cap ~{cap} comments/day)")
    if comments > cap:
        print("Over daily comment cap — pause until tomorrow")
    if posts > 0 and offset < 18:
        print("Post before day 19 — risky for new account")


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("status")
    lp = sub.add_parser("comment")
    lp.add_argument("target")
    lp.add_argument("note", nargs="?", default="")
    lp2 = sub.add_parser("post")
    lp2.add_argument("target")
    lp2.add_argument("note", nargs="?", default="")
    sub.add_parser("reset-start").set_defaults(cmd="reset")
    a = p.parse_args()
    if a.cmd == "status":
        cmd_status()
    elif a.cmd == "reset":
        data = load()
        data["start_date"] = date.today().isoformat()
        save(data)
        print(f"Reset start_date to {data['start_date']}")
    else:
        detail = f"{a.target} {a.note}".strip()
        cmd_log(a.cmd, detail)
        cmd_status()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
