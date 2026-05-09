/** One-time scan pack sizes and their Stripe Price IDs (Dashboard one-time prices). */

export const SCAN_PACK_CREDITS = [10, 50, 200] as const;
export type ScanPackCredits = (typeof SCAN_PACK_CREDITS)[number];

export function packPriceIdEnvKey(credits: ScanPackCredits): string {
  switch (credits) {
    case 10:
      return "STRIPE_PRICE_ID_SCAN_PACK_10";
    case 50:
      return "STRIPE_PRICE_ID_SCAN_PACK_50";
    case 200:
      return "STRIPE_PRICE_ID_SCAN_PACK_200";
    default: {
      const _x: never = credits;
      return _x;
    }
  }
}

export function scanPackPriceIdFromEnv(
  credits: ScanPackCredits,
  env: NodeJS.ProcessEnv
): string | undefined {
  const key = packPriceIdEnvKey(credits);
  return env[key];
}
