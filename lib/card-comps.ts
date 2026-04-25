import { withTimeout } from "@/lib/timeout";

const FETCH_MS = 12_000;
const LOG = "[card-comps]";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function browserHeadersFor(url: string, referer: string): HeadersInit {
  return {
    "User-Agent": UA,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: referer,
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  };
}

type FetchAttempt = { url: string; status: number; ok: boolean; note?: string };
type SourceAttempt = FetchAttempt & { source: "mavin" | "130point" };

/** Comps from 130point + Mavin HTML (server-side; no official APIs). */
export type CardCompsResult = {
  avg: number;
  min: number;
  max: number;
  /** Up to 10 most recent / prominent prices found in page order. */
  prices: number[];
  /** `dev_mock` only when NODE_ENV is not production and live sources returned nothing. */
  source?: "live" | "dev_mock";
};

const DEV_MOCK: Omit<CardCompsResult, "source"> = {
  avg: 420,
  min: 380,
  max: 460,
  prices: [380, 395, 410, 420, 435, 460],
};

/** Pull plausible USD sale prices from raw HTML. */
function extractUsdPrices(html: string, max = 20): number[] {
  const seen = new Set<number>();
  const out: number[] = [];

  const re = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && out.length < max) {
    const n = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    if (n < 0.5 || n > 2_000_000) continue;
    const key = Math.round(n * 100);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

async function fetchHtml(
  url: string,
  referer: string
): Promise<{ ok: true; html: string; status: number } | { ok: false; status: number; error?: string }> {
  try {
    const res = await withTimeout(
      fetch(url, {
        headers: browserHeadersFor(url, referer),
        redirect: "follow",
        cache: "no-store",
      }),
      FETCH_MS,
      null,
      "card-comps.fetch"
    );
    if (res == null) {
      return { ok: false, status: 0, error: "timeout" };
    }
    const status = res.status;
    if (!res.ok) {
      return { ok: false, status, error: `http_${status}` };
    }
    const html = await res.text();
    return { ok: true, html, status };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? e.message : String(e) };
  }
}

async function pricesFromMavin(query: string): Promise<{
  prices: number[];
  attempts: FetchAttempt[];
}> {
  const url = `https://mavin.io/search?q=${encodeURIComponent(query)}`;
  const referer = "https://mavin.io/";
  const attempts: FetchAttempt[] = [];
  const r = await fetchHtml(url, referer);
  if (r.ok) {
    attempts.push({ url, status: r.status, ok: true });
    const prices = extractUsdPrices(r.html, 15);
    return { prices, attempts };
  }
  attempts.push({
    url,
    status: r.status,
    ok: false,
    note: "error" in r ? r.error : undefined,
  });
  return { prices: [], attempts };
}

async function pricesFrom130Point(query: string): Promise<{
  prices: number[];
  attempts: FetchAttempt[];
}> {
  const candidates = [
    `https://www.130point.com/sales/?search=${encodeURIComponent(query)}`,
    `https://www.130point.com/sales/?q=${encodeURIComponent(query)}`,
    `https://130point.com/sales/?search=${encodeURIComponent(query)}`,
  ];
  const referer = "https://www.130point.com/";
  const attempts: FetchAttempt[] = [];
  for (const url of candidates) {
    const r = await fetchHtml(url, referer);
    if (r.ok) {
      attempts.push({ url, status: r.status, ok: true });
      const p = extractUsdPrices(r.html, 15);
      if (p.length > 0) {
        return { prices: p, attempts };
      }
    } else {
      attempts.push({
        url,
        status: r.status,
        ok: false,
        note: "error" in r ? r.error : undefined,
      });
    }
  }
  return { prices: [], attempts };
}

function aggregateFromPrices(combined: number[]): CardCompsResult | null {
  if (combined.length === 0) return null;
  const prices = combined.slice(0, 10);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return { avg, min, max, prices, source: "live" };
}

/**
 * Fetches recent sold-style prices from 130point and Mavin (scraped HTML).
 * Use only from server / Route Handlers — not from the browser (CORS + rate limits).
 * If one source fails, the other is used. If both yield no prices, returns `null` in production;
 * in development, a mock may be used (see code).
 */
export async function getCardComps(query: string): Promise<CardCompsResult | null> {
  const q = query.trim();
  if (!q) return null;

  let a: number[] = [];
  let b: number[] = [];
  const allAttempts: SourceAttempt[] = [];

  try {
    const [r130, rM] = await Promise.allSettled([
      pricesFrom130Point(q),
      pricesFromMavin(q),
    ]);
    if (r130.status === "fulfilled") {
      a = r130.value.prices;
      allAttempts.push(
        ...r130.value.attempts.map(
          (t) => ({ ...t, source: "130point" } as SourceAttempt)
        )
      );
    } else {
      console.warn(LOG, "130point rejected", r130.reason);
    }
    if (rM.status === "fulfilled") {
      b = rM.value.prices;
      allAttempts.push(
        ...rM.value.attempts.map(
          (t) => ({ ...t, source: "mavin" } as SourceAttempt)
        )
      );
    } else {
      console.warn(LOG, "mavin rejected", rM.reason);
    }
  } catch (e) {
    console.warn(LOG, "unexpected", e);
  }

  for (const att of allAttempts) {
    if (!att.ok) {
      console.warn(LOG, "URL failed", {
        source: att.source,
        url: att.url,
        status: att.status,
        note: att.note,
      });
    }
  }
  console.log(LOG, "source results", {
    point130: a.length,
    mavin: b.length,
    totalAttempts: allAttempts.length,
  });

  if (a.length === 0 && b.length === 0) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`${LOG} using DEV mock fallback`);
      return { ...DEV_MOCK, source: "dev_mock" };
    }
    console.warn(LOG, "no prices from any source (production: null)", { q });
    return null;
  }

  const merged: number[] = [];
  const maxLen = Math.max(a.length, b.length);
  for (let i = 0; i < maxLen && merged.length < 12; i++) {
    if (a[i] != null) merged.push(a[i]);
    if (b[i] != null) merged.push(b[i]);
  }
  for (const x of a) {
    if (merged.length >= 12) break;
    if (!merged.includes(x)) merged.push(x);
  }
  for (const x of b) {
    if (merged.length >= 12) break;
    if (!merged.includes(x)) merged.push(x);
  }

  return aggregateFromPrices(merged);
}
