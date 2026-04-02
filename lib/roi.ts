import type { CardAnalysis, GradingRoi } from "@/lib/types";
import { getPsaGradingFee } from "@/lib/psa-fees";

/** Default estimate for round-trip shipping + insurance (not PSA’s fee). */
export const DEFAULT_SHIPPING_INSURANCE_USD = 35;

/** Minimum expected net profit (PSA 10 path vs selling raw) to recommend grading. */
export const MIN_NET_TO_RECOMMEND_GRADE = 25;

function rawMid(c: Pick<CardAnalysis, "rawValueLow" | "rawValueMid" | "rawValueHigh">): number {
  if (c.rawValueMid > 0) return c.rawValueMid;
  return (c.rawValueLow + c.rawValueHigh) / 2;
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
  shippingInsuranceUsd: number = DEFAULT_SHIPPING_INSURANCE_USD
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

  return {
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
  };
}
