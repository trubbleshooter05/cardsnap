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

export type EbayCompSource = "ebay_active_listings" | "none";

export type EbayComp = {
  avgSoldPrice: number | null;
  minSoldPrice: number | null;
  maxSoldPrice: number | null;
  recentSales: number[];
  /** Browse API returns active fixed-price listings, not sold results. */
  compSource: EbayCompSource;
};

export type PsaPop = {
  psa9Pop: number | null;
  psa10Pop: number | null;
  totalPop: number | null;
};

export type MinGradeTarget = "psa9" | "psa10" | "none";

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
  /** Lowest grade where net ≥ $0 after fees + shipping. */
  minGradeToBreakEven: MinGradeTarget;
  /** Lowest grade where net ≥ MIN_NET_TO_RECOMMEND_GRADE. */
  minGradeToRecommend: MinGradeTarget;
  /** Grade recommended on PSA 10 path but PSA 9 net is negative. */
  psa9PainCase: boolean;
  loseMoneyReasons: string[];
};

export type ScanResultPayload = CardAnalysis & {
  ebay: EbayComp;
  psa: PsaPop | null;
  roi?: GradingRoi;
};
