import type { EbayComp, EbayCompDebug } from "@/lib/types";
import { withTimeout } from "@/lib/timeout";

let cachedToken: { token: string; expiresAt: number } | null = null;

const BROWSE_SEARCH_URL =
  "https://api.ebay.com/buy/browse/v1/item_summary/search";

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

function truncateForLog(text: string, max = 400): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

function envSnapshot(): EbayCompDebug["env"] {
  return {
    hasAppId: Boolean(process.env.EBAY_APP_ID?.trim()),
    hasCertId: Boolean(process.env.EBAY_CERT_ID?.trim()),
    hasStaticOAuthToken: Boolean(process.env.EBAY_OAUTH_TOKEN?.trim()),
  };
}

function logEnvState(): void {
  const env = envSnapshot();
  if (!env.hasAppId || !env.hasCertId) {
    console.warn("[ebay] missing credentials", {
      hasAppId: env.hasAppId,
      hasCertId: env.hasCertId,
      hasStaticOAuthToken: env.hasStaticOAuthToken,
      hint: "Set EBAY_APP_ID and EBAY_CERT_ID (Production). Leave EBAY_OAUTH_TOKEN unset.",
    });
  } else if (env.hasStaticOAuthToken) {
    console.warn(
      "[ebay] EBAY_OAUTH_TOKEN is set — it overrides client-credentials flow"
    );
  }
}

type TokenResult = {
  token: string | null;
  status: EbayCompDebug["tokenStatus"];
  httpStatus?: number;
  error?: string;
};

async function getEbayAccessToken(): Promise<TokenResult> {
  logEnvState();

  const staticToken = process.env.EBAY_OAUTH_TOKEN?.trim();
  if (staticToken) {
    console.log("[ebay] using static EBAY_OAUTH_TOKEN override");
    return { token: staticToken, status: "static_token" };
  }

  const clientId = process.env.EBAY_APP_ID?.trim();
  const clientSecret = process.env.EBAY_CERT_ID?.trim();
  if (!clientId || !clientSecret) {
    return { token: null, status: "missing_env" };
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return { token: cachedToken.token, status: "ok" };
  }

  console.log("[ebay] fetching production client-credentials token");
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
    8000,
    null,
    "ebay.token"
  );

  if (!res) {
    console.warn("[ebay] token request timed out");
    return { token: null, status: "oauth_timeout" };
  }

  if (!res.ok) {
    const errorBody = truncateForLog(await res.text());
    console.error("[ebay] token error", {
      httpStatus: res.status,
      body: errorBody,
    });
    return {
      token: null,
      status: "oauth_error",
      httpStatus: res.status,
      error: errorBody,
    };
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  cachedToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 7200) * 1000,
  };
  console.log("[ebay] token obtained", {
    expiresInSec: data.expires_in ?? 7200,
  });
  return { token: cachedToken.token, status: "ok" };
}

function emptyComp(debug: EbayCompDebug): EbayComp {
  const comp: EbayComp = {
    avgSoldPrice: null,
    minSoldPrice: null,
    maxSoldPrice: null,
    recentSales: [],
    compSource: "none",
  };
  if (isDev()) comp.debug = debug;
  return comp;
}

function successComp(prices: number[], debug: EbayCompDebug): EbayComp {
  const sum = prices.reduce((a, b) => a + b, 0);
  const comp: EbayComp = {
    avgSoldPrice: sum / prices.length,
    minSoldPrice: Math.min(...prices),
    maxSoldPrice: Math.max(...prices),
    recentSales: prices.slice(0, 10),
    compSource: "ebay_active_listings",
  };
  if (isDev()) comp.debug = { ...debug, fallbackReason: "live_comps_found" };
  return comp;
}

type BrowseAttempt = {
  query: string;
  filter: string;
};

type BrowseResult = {
  prices: number[];
  itemSummaryCount: number;
  httpStatus: number;
  errorBody?: string;
};

async function browseOnce(
  token: string,
  attempt: BrowseAttempt
): Promise<BrowseResult> {
  const url = new URL(BROWSE_SEARCH_URL);
  url.searchParams.set("q", attempt.query);
  url.searchParams.set("filter", attempt.filter);
  url.searchParams.set("limit", "10");

  console.log("[ebay] browse request", {
    query: attempt.query,
    filter: attempt.filter,
  });

  const res = await withTimeout(
    fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
      cache: "no-store",
    }),
    8000,
    null,
    "ebay.browse"
  );

  if (!res) {
    console.warn("[ebay] browse timed out", { query: attempt.query });
    return { prices: [], itemSummaryCount: 0, httpStatus: 0 };
  }

  if (!res.ok) {
    const errorBody = truncateForLog(await res.text());
    console.error("[ebay] browse error", {
      httpStatus: res.status,
      query: attempt.query,
      body: errorBody,
    });
    return {
      prices: [],
      itemSummaryCount: 0,
      httpStatus: res.status,
      errorBody,
    };
  }

  const data = (await res.json()) as {
    itemSummaries?: Array<{ price?: { value?: string } }>;
    total?: number;
  };

  const summaries = data.itemSummaries ?? [];
  const prices: number[] = [];
  for (const item of summaries) {
    const v = item.price?.value;
    if (v === undefined) continue;
    const n = parseFloat(v);
    if (!Number.isNaN(n) && n > 0) prices.push(n);
  }

  console.log("[ebay] browse response", {
    query: attempt.query,
    httpStatus: res.status,
    itemSummaries: summaries.length,
    pricedItems: prices.length,
    total: data.total ?? summaries.length,
  });

  return {
    prices,
    itemSummaryCount: summaries.length,
    httpStatus: res.status,
  };
}

/** Shorter query when the full string returns zero hits. */
export function simplifyEbayQuery(query: string): string {
  const words = query.replace(/\s+/g, " ").trim().split(" ");
  if (words.length <= 5) return query.trim();
  return words.slice(0, 5).join(" ");
}

function buildAttempts(primaryQuery: string): BrowseAttempt[] {
  const simplified = simplifyEbayQuery(primaryQuery);
  const attempts: BrowseAttempt[] = [
    {
      query: primaryQuery,
      filter: "buyingOptions:{FIXED_PRICE}",
    },
  ];
  if (simplified !== primaryQuery) {
    attempts.push({
      query: simplified,
      filter: "buyingOptions:{FIXED_PRICE}",
    });
  }
  attempts.push({
    query: primaryQuery,
    filter: "buyingOptions:{FIXED_PRICE|AUCTION}",
  });
  return attempts;
}

/**
 * eBay Browse search returns active listings (asking prices), not sold comps.
 * We label them honestly in the UI — do not treat as confirmed sales.
 */
export async function searchEbayItemPrices(cardName: string): Promise<EbayComp> {
  const query = cardName.trim();
  const queriesAttempted: string[] = [];
  const env = envSnapshot();

  const tokenResult = await getEbayAccessToken();
  if (!tokenResult.token) {
    const reason =
      tokenResult.status === "missing_env"
        ? "Missing EBAY_APP_ID and/or EBAY_CERT_ID"
        : tokenResult.status === "oauth_timeout"
          ? "OAuth token request timed out"
          : `OAuth token request failed (HTTP ${tokenResult.httpStatus ?? "?"})`;

    return emptyComp({
      fallbackReason: reason,
      query,
      queriesAttempted: [query],
      env,
      tokenStatus: tokenResult.status,
      tokenHttpStatus: tokenResult.httpStatus,
      tokenError: tokenResult.error,
    });
  }

  const attempts = buildAttempts(query);
  let lastBrowse: BrowseResult | null = null;
  let lastFilter = attempts[0]?.filter;

  for (const attempt of attempts) {
    queriesAttempted.push(attempt.query);
    lastFilter = attempt.filter;
    const browse = await browseOnce(tokenResult.token, attempt);
    lastBrowse = browse;

    if (browse.httpStatus >= 400) {
      continue;
    }

    if (browse.prices.length > 0) {
      return successComp(browse.prices, {
        fallbackReason: "live_comps_found",
        query,
        queriesAttempted,
        env,
        tokenStatus: tokenResult.status,
        browseHttpStatus: browse.httpStatus,
        itemSummaryCount: browse.itemSummaryCount,
        filterUsed: attempt.filter,
      });
    }
  }

  const browse = lastBrowse;
  const reason =
    browse && browse.httpStatus >= 400
      ? `Browse API error HTTP ${browse.httpStatus}`
      : browse && browse.httpStatus === 0
        ? "Browse API request timed out"
        : "Browse returned zero priced listings for all query attempts";

  console.warn("[ebay] no comps", {
    query,
    queriesAttempted,
    lastHttpStatus: browse?.httpStatus,
    lastError: browse?.errorBody,
  });

  return emptyComp({
    fallbackReason: reason,
    query,
    queriesAttempted,
    env,
    tokenStatus: tokenResult.status,
    browseHttpStatus: browse?.httpStatus,
    browseError: browse?.errorBody,
    itemSummaryCount: browse?.itemSummaryCount ?? 0,
    filterUsed: lastFilter,
  });
}

/** Strip dev debug before persisting scan rows. */
export function stripEbayDebug(comp: EbayComp): EbayComp {
  if (!comp.debug) return comp;
  const rest = { ...comp };
  delete rest.debug;
  return rest;
}

/** Re-attach debug for development API responses. */
export function withEbayDebug(comp: EbayComp, debug?: EbayCompDebug): EbayComp {
  if (!isDev() || !debug) return comp;
  return { ...comp, debug };
}
