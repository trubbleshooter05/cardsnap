import type { CardAnalysis, EbayComp, PsaPop, ScanResultPayload } from "@/lib/types";
import { computeGradingRoi } from "@/lib/roi";

export function mergeScanResults(
  ai: CardAnalysis,
  ebay: EbayComp,
  psa: PsaPop | null
): ScanResultPayload {
  const draft = { ...ai, ebay, psa };
  const roi = computeGradingRoi(ai, undefined, draft);
  return {
    ...ai,
    worthGrading: roi.headlineVerdict === "grade",
    ebay,
    psa,
    roi,
  };
}
