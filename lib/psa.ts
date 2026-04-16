import type { PsaPop } from "@/lib/types";
import { withTimeout } from "@/lib/timeout";

/**
 * Best-effort parse of PSA pop search HTML. Site structure may change.
 * PSA_API_KEY is reserved if PSA exposes a supported API later; scraping works without it.
 */
export async function fetchPsaPopulation(cardName: string): Promise<PsaPop | null> {
  const q = encodeURIComponent(cardName);
  const url = `https://www.psacard.com/pop/search?q=${q}`;

  try {
    console.log("[psa] fetching population for", cardName);
    const res = await withTimeout(
      fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; CardSnap/1.0; +https://vercel.com)",
          Accept: "text/html,application/xhtml+xml",
        },
        next: { revalidate: 0 },
      }),
      7000, // 7 second timeout for scraping
      null,
      "psa.fetch"
    );

    if (!res) {
      console.warn("[psa] timeout or error");
      return null;
    }

    if (!res.ok) {
      console.warn("[psa] non-200 response", res.status);
      return null;
    }

    const html = await res.text();

    const psa9 = matchLabelPop(html, /PSA\s*9[^0-9]*([0-9,]+)/i);
    const psa10 = matchLabelPop(html, /PSA\s*10[^0-9]*([0-9,]+)/i);

    let totalPop: number | null = null;
    const totalMatch = html.match(/total[^0-9]*pop[^0-9]*([0-9,]+)/i);
    if (totalMatch) {
      totalPop = parseInt(totalMatch[1].replace(/,/g, ""), 10);
    } else if (psa9 != null || psa10 != null) {
      totalPop = (psa9 ?? 0) + (psa10 ?? 0);
    }

    if (psa9 == null && psa10 == null && totalPop == null) {
      console.log("[psa] no population data found");
      return null;
    }

    console.log("[psa] found psa9=", psa9, "psa10=", psa10, "total=", totalPop);
    return {
      psa9Pop: psa9,
      psa10Pop: psa10,
      totalPop,
    };
  } catch (err) {
    console.error("[psa] error", err);
    return null;
  }
}

function matchLabelPop(html: string, re: RegExp): number | null {
  const m = html.match(re);
  if (!m?.[1]) return null;
  const n = parseInt(m[1].replace(/,/g, ""), 10);
  return Number.isNaN(n) ? null : n;
}
