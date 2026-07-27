---
name: spec
description: Interview the user about a feature idea for CardSnap and file it as a structured Linear ticket (team HER, project "CardSnap") ready for the build loop. Trigger on /spec.
allowed-tools:
  - mcp__claude_ai_Linear__list_issues
  - mcp__claude_ai_Linear__save_issue
  - AskUserQuestion
---

# spec — Fin Loop, CardSnap

Run once per idea, manually, in the morning. This is the only creative step — everything after this is autonomous.

## Steps

1. Ask the user for a one-line idea.
2. Interview them with follow-up questions until you could hand this to an engineer with zero further context. Cover problem, acceptance criteria, non-goals, and scope notes.
3. Create a Linear issue via `mcp__claude_ai_Linear__save_issue` with team "HER", project "CardSnap", and markdown sections `## Problem`, `## Acceptance Criteria`, `## Non-goals`, `## Scope Notes`. Leave in Backlog.
4. Confirm issue URL(s) to the user. Do not build.

Repeat until the user is done for the morning.
