import type { EbayComp } from "@/lib/types";
import { withTimeout } from "@/lib/timeout";

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getEbayAccessToken(): Promise<string | null> {
  const staticToken = process.env.EBAY_OAUTH_TOKEN?.trim();
  if (staticToken) return staticToken;

  const clientId = process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CERT_ID;
  if (!clientId || !clientSecret) return null;

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  console.log("[ebay] fetching token");
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "https://api.ebay.com/oauth/api_scope",
  });

  const res = await withTimeout(
    fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body,
    }),
    8000, // 8 second timeout
    null,
    "ebay.token"
  );

  if (!res) {
    console.warn("[ebay] token timeout");
    return null;
  }

  if (!res.ok) {
    console.error("[ebay] token error", await res.text());
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 7200) * 1000,
  };
  console.log("[ebay] token obtained");
  return cachedToken.token;
}

function emptyComp(): EbayComp {
  return {
    avgSoldPrice: null,
    minSoldPrice: null,
    maxSoldPrice: null,
    recentSales: [],
  };
}

/**
 * eBay Browse search returns active fixed-price listings; prices are used as recent market comps.
 */
export async function searchEbayItemPrices(cardName: string): Promise<EbayComp> {
  const token = await getEbayAccessToken();
  if (!token) return emptyComp();

  console.log("[ebay] searching for", cardName);
  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", cardName);
  url.searchParams.set(
    "filter",
    "buyingOptions:{FIXED_PRICE},conditions:{USED}"
  );
  url.searchParams.set("limit", "10");

  const res = await withTimeout(
    fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
      next: { revalidate: 0 },
    }),
    8000, // 8 second timeout
    null,
    "ebay.browse"
  );

  if (!res) {
    console.warn("[ebay] browse timeout");
    return emptyComp();
  }

  if (!res.ok) {
    console.error("[ebay] browse error", await res.text());
    return emptyComp();
  }

  const data = (await res.json()) as {
    itemSummaries?: Array<{ price?: { value?: string } }>;
  };

  const summaries = data.itemSummaries ?? [];
  const prices: number[] = [];
  for (const item of summaries) {
    const v = item.price?.value;
    if (v === undefined) continue;
    const n = parseFloat(v);
    if (!Number.isNaN(n)) prices.push(n);
  }

  if (prices.length === 0) {
    console.log("[ebay] no prices found for", cardName);
    return emptyComp();
  }

  const sum = prices.reduce((a, b) => a + b, 0);
  console.log("[ebay] found", prices.length, "prices");
  return {
    avgSoldPrice: sum / prices.length,
    minSoldPrice: Math.min(...prices),
    maxSoldPrice: Math.max(...prices),
    recentSales: prices.slice(0, 10),
  };
}
