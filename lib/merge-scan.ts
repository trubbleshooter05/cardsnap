import type { CardAnalysis, EbayComp, PsaPop, ScanResultPayload } from "@/lib/types";
import { computeGradingRoi } from "@/lib/roi";

export function mergeScanResults(
  ai: CardAnalysis,
  ebay: EbayComp,
  psa: PsaPop | null
): ScanResultPayload {
  const roi = computeGradingRoi(ai);
  return {
    ...ai,
    worthGrading: roi.headlineVerdict === "grade",
    ebay,
    psa,
    roi,
  };
}
