import cardsJson from "@/data/cards.json";

/**
 * Programmatic SEO card pages. Source data lives in `data/cards.json` so
 * `scripts/generate-card-content.ts` and `scripts/add-cards.ts` can update it safely.
 */

export type CardSport =
  | "baseball"
  | "basketball"
  | "football"
  | "hockey"
  | "golf";

export type GradingVerdict = "worth_grading" | "skip_grading";

export interface CardPage {
  slug: string;
  playerName: string;
  year: number;
  brand: string;
  setName: string;
  cardNumber: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** HTML article body; fill via `npx tsx scripts/generate-card-content.ts` */
  content: string;
  rawValueLow: number;
  rawValueHigh: number;
  psa9Value: number;
  psa10Value: number;
  popCount: number;
  gradingVerdict: GradingVerdict;
  sport: CardSport;
  relatedSlugs: string[];
  createdAt: string;
  updatedAt: string;
}

export const cardPages: CardPage[] = cardsJson as CardPage[];

export function getCardPageBySlug(slug: string): CardPage | undefined {
  return cardPages.find((c) => c.slug === slug);
}

export function getAllCardSlugs(): { slug: string }[] {
  return cardPages.map((c) => ({ slug: c.slug }));
}

export function getRelatedCards(slug: string, limit = 6): CardPage[] {
  const page = getCardPageBySlug(slug);
  if (!page) return [];
  const related = page.relatedSlugs
    .map((s) => getCardPageBySlug(s))
    .filter((c): c is CardPage => Boolean(c));
  if (related.length >= limit) return related.slice(0, limit);
  const rest = cardPages
    .filter((c) => c.slug !== slug && !page.relatedSlugs.includes(c.slug))
    .slice(0, limit - related.length);
  return [...related, ...rest].slice(0, limit);
}

export function getCardsBySport(): Record<CardSport, CardPage[]> {
  const out: Record<CardSport, CardPage[]> = {
    baseball: [],
    basketball: [],
    football: [],
    hockey: [],
    golf: [],
  };
  for (const c of cardPages) {
    out[c.sport].push(c);
  }
  for (const k of Object.keys(out) as CardSport[]) {
    out[k].sort((a, b) => a.playerName.localeCompare(b.playerName));
  }
  return out;
}

export const SPORT_ORDER: CardSport[] = [
  "basketball",
  "baseball",
  "football",
  "hockey",
  "golf",
];

export function sportLabel(s: CardSport): string {
  const labels: Record<CardSport, string> = {
    baseball: "Baseball",
    basketball: "Basketball",
    football: "Football",
    hockey: "Hockey",
    golf: "Golf",
  };
  return labels[s];
}
