import { cardPages } from "@/lib/cards";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export async function GET() {
  const base = getSiteUrl();

  const cardList = cardPages
    .map(
      (c) =>
        `- ${base}/cards/${c.slug} : ${c.playerName} ${c.year} ${c.brand} #${c.cardNumber} — raw value $${c.rawValueLow}–$${c.rawValueHigh}, PSA 10 ~$${c.psa10Value}, verdict: ${c.gradingVerdict === "worth_grading" ? "worth grading" : "skip grading"}`
    )
    .join("\n");

  const body = `# CardSnap

> CardSnap is a free sports card grading tool. Users type in any sports card name and condition and receive instant raw value ranges, PSA 9 and PSA 10 graded values, PSA population data, and a clear "Grade it / Skip it" verdict with ROI calculation.

## What CardSnap does

- Analyzes sports cards by name and condition using AI and market data
- Returns raw card value ranges based on recent comparable sales
- Returns PSA 9 and PSA 10 estimated values
- Shows PSA population (how many copies have been graded)
- Calculates grading ROI: net profit or loss if you submit to PSA, after grading fees and estimated shipping
- Gives a final verdict: "Grade it" (if net gain ≥ $25) or "Skip it"
- Free for 5 scans per month; Pro plan ($9.99/month) for unlimited scans

## Who it is for

Sports card collectors and investors who want to know whether submitting a card to PSA for grading is financially worth it.

## Key pages

- ${base}/ : Main scan tool — enter any sports card and get an instant verdict
- ${base}/cards : Index of all card value guides, grouped by sport

## Card value guides (programmatic SEO pages)

Each page covers: raw value range, PSA 9 / PSA 10 comps, PSA population, and a grading verdict.

${cardList}

## Technology

Built with Next.js 14, Supabase, OpenAI, and deployed on Vercel. No user account required for free scans.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
