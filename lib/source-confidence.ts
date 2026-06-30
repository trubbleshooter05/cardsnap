import type { ScanResultPayload } from "@/lib/types";

export type ConfidenceLevel = "High" | "Medium" | "Directional";

export type CompSourceLabels = {
  rawLabel: string;
  gradedLabel: string;
  overall: ConfidenceLevel;
};

function hasEbayPrice(avg: number | null | undefined): boolean {
  return avg != null && !Number.isNaN(avg);
}

/** Human-readable comp provenance for UI badges and paste blocks. */
export function describeCompSource(data: ScanResultPayload): CompSourceLabels {
  const ebayOk = hasEbayPrice(data.ebay.avgSoldPrice);
  const psaOk = Boolean(
    data.psa && (data.psa.psa9Pop != null || data.psa.psa10Pop != null)
  );

  const compSource = data.ebay.compSource ?? (ebayOk ? "ebay_active_listings" : "none");

  const rawLabel = ebayOk
    ? compSource === "ebay_active_listings"
      ? "Active listings (asking prices)"
      : "Live marketplace comps"
    : "Model estimate (no live comps)";

  const gradedLabel = psaOk
    ? "Model + PSA population context"
    : "Model estimate only";

  let overall: ConfidenceLevel = "Directional";
  if (ebayOk && psaOk) overall = "High";
  else if (ebayOk || psaOk) overall = "Medium";

  return { rawLabel, gradedLabel, overall };
}
