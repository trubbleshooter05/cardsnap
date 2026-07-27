---
name: review
description: Test each CardSnap ticket marked "In Review", open a PR if it passes, and Telegram-notify the user with a merge link. Meant to be run on a recurring /loop (e.g. `/loop 5m /review`).
allowed-tools:
  - mcp__claude_ai_Linear__list_issues
  - mcp__claude_ai_Linear__save_issue
  - mcp__claude_ai_Linear__save_comment
  - Read
  - Bash
  - Grep
---

# review — Fin Loop, CardSnap

1. List In Review — team "HER", project "CardSnap". If none, stop.
2. Oldest → checkout `issue/<identifier>`.
3. Verify:
   - `npm run build` — must succeed
   - `npm run lint` — must succeed (fix or note any failures)
   - Diff vs `main` matches acceptance criteria and non-goals.
4. Pass → `gh pr create`, move issue Done, Telegram notify (see stripe-leak-audit review skill for curl pattern using `~/.hermes/.env`). Fail → comment, Backlog, no Telegram.
5. `git checkout main`.
