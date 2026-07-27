---
name: build
description: Pick the oldest Backlog ticket in the CardSnap Linear project and implement it end-to-end, then hand off to review. Meant to be run on a recurring /loop (e.g. `/loop 5m /build`).
allowed-tools:
  - mcp__claude_ai_Linear__list_issues
  - mcp__claude_ai_Linear__save_issue
  - mcp__claude_ai_Linear__save_comment
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# build — Fin Loop, CardSnap

Each invocation handles exactly one ticket, then stops.

1. List Backlog issues — team "HER", project "CardSnap". If none, stop.
2. Oldest → In Progress.
3. Implement in `/Users/openclaw/projects/cardsnap` per acceptance criteria and non-goals only.
4. Self-check:
   - `npm run build` — must succeed
   - `npm run lint` — must succeed (fix or note any failures)
5. Branch `issue/<identifier>`, commit, push. Do not commit to `main`.
6. Move to In Review; comment what was built and tested.
7. Stop — no PR (review skill opens PR).

On unfixable failure: comment, move back to Backlog.
