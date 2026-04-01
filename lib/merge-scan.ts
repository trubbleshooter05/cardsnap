import type { CardAnalysis, EbayComp, PsaPop, ScanResultPayload } from "@/lib/types";

export function mergeScanResults(
  ai: CardAnalysis,
  ebay: EbayComp,
  psa: PsaPop | null
): ScanResultPayload {
  return {
    ...ai,
    ebay,
    psa,
  };
}
