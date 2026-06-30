# CardSnap community replies (proof-paste motion)

Phase 1 validation uses **proof paste**, not link drops. Goal: stranger says unprompted "that helped."

## When to paste

- OP named a specific card (or you confirmed which card via DM)
- You ran CardSnap on that exact card
- Thread is pre-submit grading intent (not post-Mint / already-submitted)

## Format (no link)

```
Ran [card] — [directional comps | thin comps / model estimate]:
Raw ~$X · PSA 9 ~$Y (net ~+$A after fees) · PSA 10 ~$Z (net ~+$B after fees)
[optional PSA 9 pain line if headline assumes 10]
[optional: raw comp uses active asking prices, not confirmed solds]
Happy to re-run if you name a different card or condition.
```

Attach a **screenshot** of the CardSnap result card when posting on Reddit.

## Copy from the app

After a scan, tap **Copy community reply (no link)** on the result card.

## CLI (same formatter)

```bash
cat scan-result.json | python3 scripts/paste_verdict.py
```

JSON shape: CardSnap `ScanResultPayload` (see `lib/types.ts`).

## Do not

- Drop getcardsnap.com unless they ask
- Guess which card when OP listed many — DM "which one should I run?"
- Paste on wrong-card matches or post-submit threads

## Track outcomes

Log rows on the Riley sheet `proof_paste` tab only — not general touch count.
