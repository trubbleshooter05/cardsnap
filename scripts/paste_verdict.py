#!/usr/bin/env python3
"""Format a CardSnap scan JSON payload as a proof-paste reply (no link)."""

from __future__ import annotations

import json
import sys


def fmt_usd(n: float | int | None) -> str:
    if n is None:
        return "—"
    return f"${round(float(n)):,}"


def fmt_signed(n: float | int) -> str:
    v = round(float(n))
    s = fmt_usd(abs(v))
    if v > 0:
        return f"+{s}"
    if v < 0:
        return f"−{s}"
    return s


def raw_mid(payload: dict) -> float:
    mid = payload.get("rawValueMid") or 0
    if mid:
        return float(mid)
    lo = float(payload.get("rawValueLow") or 0)
    hi = float(payload.get("rawValueHigh") or 0)
    return (lo + hi) / 2


def format_paste(payload: dict) -> str:
    roi = payload.get("roi") or {}
    name = payload.get("confirmedName") or "this card"
    psa9 = float(payload.get("gradedPSA9Value") or 0)
    psa10 = float(payload.get("gradedPSA10Value") or 0)
    raw = float(roi.get("rawLiquidationUsd") or raw_mid(payload))
    net9 = float(roi.get("netIfPSA9") or 0)
    net10 = float(roi.get("netIfPSA10") or 0)
    verdict = roi.get("headlineVerdict") or "skip"
    psa9_pain = bool(roi.get("psa9PainCase"))

    ebay = payload.get("ebay") or {}
    comp_source = ebay.get("compSource")
    has_ebay = ebay.get("avgSoldPrice") is not None
    if comp_source is None and has_ebay:
        comp_source = "ebay_active_listings"

    psa = payload.get("psa") or {}
    has_pop = psa.get("psa9Pop") is not None or psa.get("psa10Pop") is not None
    if has_ebay and has_pop:
        qualifier = "recent comps"
    elif has_ebay or has_pop:
        qualifier = "directional comps"
    else:
        qualifier = "thin comps / model estimate"

    lines = [
        f"Ran {name} — {qualifier}:",
        f"Raw ~{fmt_usd(raw)} · PSA 9 ~{fmt_usd(psa9)} (net ~{fmt_signed(net9)} after fees) · PSA 10 ~{fmt_usd(psa10)} (net ~{fmt_signed(net10)} after fees)",
    ]

    if verdict == "grade" and psa9_pain:
        lines.append(
            f"Headline assumes PSA 10 — a 9 lands around {fmt_signed(net9)} net after PSA fee + est. shipping."
        )
    elif verdict == "skip":
        lines.append(
            f"Verdict: skip — modeled upside on a 10 is {fmt_signed(net10)} vs selling raw."
        )

    if comp_source == "ebay_active_listings":
        lines.append("Raw comp uses active asking prices, not confirmed solds.")

    lines.append("Happy to re-run if you name a different card or condition.")
    return "\n".join(lines)


def main() -> int:
    raw = sys.stdin.read()
    if not raw.strip():
        print("Pass ScanResultPayload JSON on stdin", file=sys.stderr)
        return 1
    payload = json.loads(raw)
    print(format_paste(payload))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
