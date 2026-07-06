/**
 * eBay Partner Network (EPN) affiliate links for getcardsnap.com.
 * Requires EBAY_EPN_CAMPID in env (from partnernetwork.ebay.com after approval).
 */

const US_MKRID = "711-53200-19255-0";
const TOOL_ID = "10001";

export type EbayAffiliateContext = {
  customId?: string;
  soldOnly?: boolean;
};

function campId(): string | null {
  const id =
    process.env.NEXT_PUBLIC_EBAY_EPN_CAMPID?.trim() ||
    process.env.EBAY_EPN_CAMPID?.trim();
  return id || null;
}

export function isEbayAffiliateEnabled(): boolean {
  return Boolean(campId());
}

export function buildEbaySoldSearchAffiliateUrl(
  query: string,
  ctx: EbayAffiliateContext = {}
): string | null {
  const campid = campId();
  if (!campid || !query.trim()) return null;

  const url = new URL("https://www.ebay.com/sch/i.html");
  url.searchParams.set("_nkw", query.trim());
  url.searchParams.set("mkcid", "1");
  url.searchParams.set("mkrid", US_MKRID);
  url.searchParams.set("siteid", "0");
  url.searchParams.set("campid", campid);
  url.searchParams.set("toolid", TOOL_ID);
  if (ctx.customId?.trim()) {
    url.searchParams.set("customid", ctx.customId.trim().slice(0, 50));
  }
  if (ctx.soldOnly !== false) {
    url.searchParams.set("LH_Sold", "1");
    url.searchParams.set("LH_Complete", "1");
  }
  return url.toString();
}

export function buildEbayItemAffiliateUrl(
  itemId: string,
  ctx: EbayAffiliateContext = {}
): string | null {
  const campid = campId();
  const id = itemId.replace(/\D/g, "");
  if (!campid || !id) return null;

  const url = new URL(`https://www.ebay.com/itm/${id}`);
  url.searchParams.set("mkcid", "1");
  url.searchParams.set("mkrid", US_MKRID);
  url.searchParams.set("siteid", "0");
  url.searchParams.set("campid", campid);
  url.searchParams.set("toolid", TOOL_ID);
  if (ctx.customId?.trim()) {
    url.searchParams.set("customid", ctx.customId.trim().slice(0, 50));
  }
  return url.toString();
}

export const EBAY_AFFILIATE_DISCLOSURE =
  "As an eBay Partner, CardSnap may earn commission from qualifying purchases.";
