import type { CardAnalysis, GradingRoi, MinGradeTarget, ScanResultPayload } from "@/lib/types";
import { getPsaGradingFee } from "@/lib/psa-fees";
import { formatUsdSigned } from "@/lib/format-currency";

/** Default estimate for round-trip shipping + insurance (not PSA’s fee). */
export const DEFAULT_SHIPPING_INSURANCE_USD = 35;

/** Minimum expected net profit (PSA 10 path vs selling raw) to recommend grading. */
export const MIN_NET_TO_RECOMMEND_GRADE = 25;

function rawMid(c: Pick<CardAnalysis, "rawValueLow" | "rawValueMid" | "rawValueHigh">): number {
  if (c.rawValueMid > 0) return c.rawValueMid;
  return (c.rawValueLow + c.rawValueHigh) / 2;
}

export function minGradeForNet(
  netIfPSA9: number,
  netIfPSA10: number,
  thresholdUsd: number
): MinGradeTarget {
  if (netIfPSA9 >= thresholdUsd) return "psa9";
  if (netIfPSA10 >= thresholdUsd) return "psa10";
  return "none";
}

function gradeLabel(grade: MinGradeTarget): string {
  if (grade === "psa9") return "PSA 9";
  if (grade === "psa10") return "PSA 10";
  return "none";
}

export function buildLoseMoneyReasons(
  data: Pick<
    ScanResultPayload,
    "ebay" | "psa" | "gradedPSA9Value" | "gradedPSA10Value" | "verdictReason"
  >,
  roi: GradingRoi
): string[] {
  const reasons: string[] = [];

  if (roi.netIfPSA9 < 0) {
    reasons.push(
      `If it comes back PSA 9, modeled net is ${formatUsdSigned(roi.netIfPSA9)} after PSA fee and est. shipping — fees can eat the upside.`
    );
  } else if (
    roi.headlineVerdict === "grade" &&
    roi.netIfPSA9 < MIN_NET_TO_RECOMMEND_GRADE
  ) {
    reasons.push(
      `A PSA 9 only nets about ${formatUsdSigned(roi.netIfPSA9)} — below the ~$${MIN_NET_TO_RECOMMEND_GRADE} bar we use for a clear grade call.`
    );
  }

  if (roi.headlineVerdict === "grade" && roi.minGradeToRecommend === "psa10") {
    reasons.push(
      `Break-even for a “grade it” call is ${gradeLabel(roi.minGradeToRecommend)} — a 9 may not clear fees.`
    );
  }

  const compSource = data.ebay.compSource ?? (data.ebay.avgSoldPrice != null ? "ebay_active_listings" : "none");

  if (compSource === "ebay_active_listings") {
    reasons.push(
      "Raw comp uses active eBay asking prices, not confirmed sold results — realizable raw value can differ."
    );
  } else if (data.ebay.avgSoldPrice == null) {
    reasons.push(
      "No live comps were found — raw and graded numbers lean on model estimates."
    );
  }

  if (!data.psa || (data.psa.psa9Pop == null && data.psa.psa10Pop == null)) {
    reasons.push("PSA population data was missing — graded resale bands are less grounded.");
  }

  if (roi.netIfPSA10 < 0 && roi.headlineVerdict === "skip") {
    reasons.push(
      `Even a PSA 10 is modeled at ${formatUsdSigned(roi.netIfPSA10)} vs selling raw — upside may not cover submission costs.`
    );
  }

  return reasons.slice(0, 4);
}

/**
 * Net = graded resale − what you’d expect selling raw − PSA fee − shipping/insurance.
 * Fee tier uses max(liquidation, PSA 10 estimate) as a conservative declared-value proxy.
 */
export function computeGradingRoi(
  c: Pick<
    CardAnalysis,
    | "rawValueLow"
    | "rawValueMid"
    | "rawValueHigh"
    | "gradedPSA9Value"
    | "gradedPSA10Value"
  >,
  shippingInsuranceUsd: number = DEFAULT_SHIPPING_INSURANCE_USD,
  context?: Pick<ScanResultPayload, "ebay" | "psa" | "verdictReason">
): GradingRoi {
  const rawLiquidationUsd = rawMid(c);
  const declaredValueForFeeUsd = Math.max(
    rawLiquidationUsd,
    c.gradedPSA10Value,
    c.gradedPSA9Value
  );
  const { feeUsd, tierCapUsd } = getPsaGradingFee(declaredValueForFeeUsd);
  const totalCostToGradeUsd = feeUsd + shippingInsuranceUsd;

  const netIfPSA9 = c.gradedPSA9Value - rawLiquidationUsd - totalCostToGradeUsd;
  const netIfPSA10 = c.gradedPSA10Value - rawLiquidationUsd - totalCostToGradeUsd;
  const headlineNetUsd = netIfPSA10;
  const headlineVerdict =
    headlineNetUsd >= MIN_NET_TO_RECOMMEND_GRADE ? "grade" : "skip";

  const minGradeToBreakEven = minGradeForNet(netIfPSA9, netIfPSA10, 0);
  const minGradeToRecommend = minGradeForNet(
    netIfPSA9,
    netIfPSA10,
    MIN_NET_TO_RECOMMEND_GRADE
  );
  const psa9PainCase =
    headlineVerdict === "grade" && netIfPSA9 < MIN_NET_TO_RECOMMEND_GRADE;

  const base: GradingRoi = {
    rawLiquidationUsd,
    declaredValueForFeeUsd,
    psaGradingFeeUsd: feeUsd,
    psaFeeTierCapUsd: tierCapUsd,
    shippingInsuranceEstimateUsd: shippingInsuranceUsd,
    totalCostToGradeUsd,
    netIfPSA9,
    netIfPSA10,
    headlineNetUsd,
    headlineVerdict,
    minGradeToBreakEven,
    minGradeToRecommend,
    psa9PainCase,
    loseMoneyReasons: [],
  };

  if (context) {
    base.loseMoneyReasons = buildLoseMoneyReasons(
      { ...context, gradedPSA9Value: c.gradedPSA9Value, gradedPSA10Value: c.gradedPSA10Value },
      base
    );
  }

  return base;
}
