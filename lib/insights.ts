const INSIGHTS_API = "http://localhost:3001";

export async function getOpportunities(limit = 5) {
  try {
    const res = await fetch(`${INSIGHTS_API}/api/insights/opportunities?site=cardsnap&limit=${limit}`);
    return res.json();
  } catch (e) {
    console.error("Insights API error:", e);
    return { opportunities: [] };
  }
}

export async function getTrendingKeywords() {
  try {
    const res = await fetch(`${INSIGHTS_API}/api/insights/keywords?trending=true&category=grading`);
    return res.json();
  } catch (e) {
    console.error("Insights API error:", e);
    return { keywords: [] };
  }
}

export async function getRecommendedActions() {
  try {
    const res = await fetch(`${INSIGHTS_API}/api/insights/actions?for_user=true`);
    return res.json();
  } catch (e) {
    console.error("Insights API error:", e);
    return { actions: [] };
  }
}
