/**
 * PSA grading fee tiers by maximum declared value (illustrative).
 * Verify against https://www.psacard.com/services/tradingcardgrading — update as PSA changes prices.
 */
const PSA_GRADING_TIERS: { maxDeclaredUsd: number; feeUsd: number }[] = [
  { maxDeclaredUsd: 500, feeUsd: 32.99 },
  { maxDeclaredUsd: 1000, feeUsd: 64.99 },
  { maxDeclaredUsd: 1500, feeUsd: 79.99 },
  { maxDeclaredUsd: 2500, feeUsd: 99.99 },
  { maxDeclaredUsd: 5000, feeUsd: 149.99 },
  { maxDeclaredUsd: 10000, feeUsd: 249.99 },
  { maxDeclaredUsd: 25000, feeUsd: 349.99 },
  { maxDeclaredUsd: 100000, feeUsd: 599.99 },
  { maxDeclaredUsd: Infinity, feeUsd: 999.99 },
];

export type PsaFeeQuote = {
  feeUsd: number;
  /** Upper bound of the declared-value bucket used (for display). */
  tierCapUsd: number;
};

/**
 * Pick PSA grading fee based on declared value of the card (pre-grade estimate).
 * Uses the bucket that covers `declaredValueUsd`.
 */
export function getPsaGradingFee(declaredValueUsd: number): PsaFeeQuote {
  const v = Math.max(0, declaredValueUsd);
  for (const tier of PSA_GRADING_TIERS) {
    if (v <= tier.maxDeclaredUsd) {
      return { feeUsd: tier.feeUsd, tierCapUsd: tier.maxDeclaredUsd };
    }
  }
  const last = PSA_GRADING_TIERS[PSA_GRADING_TIERS.length - 1];
  return { feeUsd: last.feeUsd, tierCapUsd: last.maxDeclaredUsd };
}
