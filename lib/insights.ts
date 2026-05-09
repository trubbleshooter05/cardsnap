/**
 * Insights / opportunities for the homepage widget.
 * Use same-origin `/api/insights/...` so production never calls localhost from the browser.
 */

export async function getOpportunities(limit = 5) {
  try {
    const res = await fetch(`/api/insights/opportunities?limit=${limit}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("Insights opportunities HTTP", res.status);
      return { opportunities: [] };
    }
    return res.json() as Promise<{ opportunities?: unknown[] }>;
  } catch (e) {
    console.error("Insights API error:", e);
    return { opportunities: [] };
  }
}

/** Server-side helpers when a deployed insights base URL exists. */

export async function getTrendingKeywords() {
  const base = process.env.INSIGHTS_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return { keywords: [] };
  try {
    const res = await fetch(
      `${base}/api/insights/keywords?trending=true&category=grading`,
      { next: { revalidate: 300 } }
    );
    return res.json();
  } catch (e) {
    console.error("Insights API error:", e);
    return { keywords: [] };
  }
}

export async function getRecommendedActions() {
  const base = process.env.INSIGHTS_API_BASE_URL?.replace(/\/$/, "");
  if (!base) return { actions: [] };
  try {
    const res = await fetch(`${base}/api/insights/actions?for_user=true`, {
      next: { revalidate: 300 },
    });
    return res.json();
  } catch (e) {
    console.error("Insights API error:", e);
    return { actions: [] };
  }
}
