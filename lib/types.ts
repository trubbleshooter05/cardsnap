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

/** Dev-only diagnostics for why eBay comps did or did not load. Never persist to DB. */
export type EbayCompDebug = {
  fallbackReason: string;
  query: string;
  queriesAttempted: string[];
  env: {
    hasAppId: boolean;
    hasCertId: boolean;
    hasStaticOAuthToken: boolean;
  };
  tokenStatus:
    | "ok"
    | "missing_env"
    | "static_token"
    | "oauth_error"
    | "oauth_timeout";
  tokenHttpStatus?: number;
  tokenError?: string;
  browseHttpStatus?: number;
  browseError?: string;
  itemSummaryCount?: number;
  filterUsed?: string;
};

export type EbayComp = {
  avgSoldPrice: number | null;
  minSoldPrice: number | null;
  maxSoldPrice: number | null;
  recentSales: number[];
  /** Browse API returns active fixed-price listings, not sold results. */
  compSource: EbayCompSource;
  /** Attached in development API responses only — not stored in Supabase. */
  debug?: EbayCompDebug;
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
