export type CardAnalysis = {
  confirmedName: string;
  year: string | number;
  player: string;
  set: string;
  sport: string;
  rawValueLow: number;
  rawValueMid: number;
  rawValueHigh: number;
  gradedPSA9Value: number;
  gradedPSA10Value: number;
  worthGrading: boolean;
  verdictReason: string;
};

export type EbayComp = {
  avgSoldPrice: number | null;
  minSoldPrice: number | null;
  maxSoldPrice: number | null;
  recentSales: number[];
};

export type PsaPop = {
  psa9Pop: number | null;
  psa10Pop: number | null;
  totalPop: number | null;
};

export type GradingRoi = {
  rawLiquidationUsd: number;
  declaredValueForFeeUsd: number;
  psaGradingFeeUsd: number;
  psaFeeTierCapUsd: number;
  shippingInsuranceEstimateUsd: number;
  totalCostToGradeUsd: number;
  netIfPSA9: number;
  netIfPSA10: number;
  headlineNetUsd: number;
  headlineVerdict: "grade" | "skip";
};

export type ScanResultPayload = CardAnalysis & {
  ebay: EbayComp;
  psa: PsaPop | null;
  roi?: GradingRoi;
};
