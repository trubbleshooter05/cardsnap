import type { ScanResultPayload } from "@/lib/types";
import { formatUsd, formatUsdSigned } from "@/lib/format-currency";
import { computeGradingRoi } from "@/lib/roi";
import { describeCompSource } from "@/lib/source-confidence";

export type CommunityPasteReadiness = {
  ok: boolean;
  reasons: string[];
  fixHints: string[];
};

function hasEbayPrice(avg: number | null | undefined): boolean {
  return avg != null && !Number.isNaN(avg) && avg > 0;
}

function identityTooVague(data: ScanResultPayload): boolean {
  const set = (data.set ?? "").trim().toLowerCase();
  const name = (data.confirmedName ?? "").trim().toLowerCase();
  return set === "unknown" || set === "" || /\bunknown\b/.test(name);
}

/** Block Reddit proof-paste when comps or card ID are not trustworthy. */
export function assessCommunityPasteReadiness(
  data: ScanResultPayload
): CommunityPasteReadiness {
  const roi = data.roi ?? computeGradingRoi(data, undefined, data);
  const reasons: string[] = [];
  const fixHints: string[] = [];

  if (!hasEbayPrice(data.ebay.avgSoldPrice)) {
    reasons.push("No live marketplace comps for this search.");
    fixHints.push(
      "Re-run with year, set, card number, serial (/5, 1/1), and parallel name from the slab."
    );
  }

  if (identityTooVague(data)) {
    reasons.push("Card identity is too vague (unknown set or name).");
    fixHints.push("Copy the exact text from the BGS/PSA label or card back.");
  }

  if (roi.rawLiquidationUsd <= 0 && data.gradedPSA9Value <= 0 && data.gradedPSA10Value <= 0) {
    reasons.push("Modeled values are all $0 — verdict is not usable.");
  }

  const cardMatch = roi.loseMoneyReasons.find((r) => r.startsWith("Card match:"));
  if (cardMatch) {
    reasons.push(cardMatch.replace(/^Card match:\s*/, ""));
  }

  return {
    ok: reasons.length === 0,
    reasons,
    fixHints: Array.from(new Set(fixHints)),
  };
}

export function formatPasteVerdict(data: ScanResultPayload): string {
  const roi = data.roi ?? computeGradingRoi(data, undefined, data);
  const comp = describeCompSource(data);
  const qualifier =
    comp.overall === "High"
      ? "recent comps"
      : comp.overall === "Medium"
        ? "directional comps"
        : "thin comps / model estimate";

  const lines = [
    `Ran ${data.confirmedName} — ${qualifier}:`,
    `Raw ~${formatUsd(roi.rawLiquidationUsd)} · PSA 9 ~${formatUsd(data.gradedPSA9Value)} (net ~${formatUsdSigned(roi.netIfPSA9)} after fees) · PSA 10 ~${formatUsd(data.gradedPSA10Value)} (net ~${formatUsdSigned(roi.netIfPSA10)} after fees)`,
  ];

  if (roi.headlineVerdict === "grade" && roi.psa9PainCase) {
    lines.push(
      `Headline assumes PSA 10 — a 9 lands around ${formatUsdSigned(roi.netIfPSA9)} net after PSA fee + est. shipping.`
    );
  } else if (roi.headlineVerdict === "skip") {
    lines.push(
      `Verdict: skip — modeled upside on a 10 is ${formatUsdSigned(roi.netIfPSA10)} vs selling raw.`
    );
  }

  const cardMatchLine = roi.loseMoneyReasons.find((r) => r.startsWith("Card match:"));
  if (cardMatchLine) {
    lines.push(cardMatchLine.replace(/^Card match:\s*/, "⚠️ "));
  }

  if (comp.rawLabel.includes("Active listings")) {
    lines.push("Raw comp uses active asking prices, not confirmed solds.");
  }

  lines.push("Happy to re-run if you name a different card or condition.");

  return lines.join("\n");
}
