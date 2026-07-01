import type { ScanResultPayload } from "@/lib/types";
import { formatUsd, formatUsdSigned } from "@/lib/format-currency";
import { computeGradingRoi } from "@/lib/roi";
import { describeCompSource } from "@/lib/source-confidence";

/**
 * Reddit / FB proof-paste block — numbers + caveat, no link.
 * Attach a screenshot separately when posting.
 */
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
