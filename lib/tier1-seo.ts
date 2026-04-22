import type { CardPage } from "@/lib/cards";

/** High-intent programmatic templates only. */
export type Tier1Template = "should_grade" | "psa10_value" | "raw_vs_graded";

export type Tier1Entry = {
  cardSlug: string;
  template: Tier1Template;
};

/**
 * Tier 1 pages (10): 3 keyword families × curated cards.
 * Data values come from `data/cards.json` via `cardSlug`.
 */
export const TIER1_SEO_PAGES: Tier1Entry[] = [
  { template: "should_grade", cardSlug: "luka-doncic-2018-panini-prizm-280-value" },
  { template: "should_grade", cardSlug: "michael-jordan-1986-fleer-57-value" },
  { template: "should_grade", cardSlug: "lebron-james-2003-topps-chrome-111-value" },
  { template: "should_grade", cardSlug: "mike-trout-2011-topps-update-us175-value" },
  { template: "psa10_value", cardSlug: "mickey-mantle-1952-topps-311-value" },
  { template: "psa10_value", cardSlug: "patrick-mahomes-2017-panini-prizm-269-value" },
  { template: "psa10_value", cardSlug: "anthony-edwards-2020-panini-prizm-258-value" },
  { template: "raw_vs_graded", cardSlug: "ja-morant-2019-panini-prizm-249-value" },
  { template: "raw_vs_graded", cardSlug: "trae-young-2018-panini-prizm-78-value" },
  { template: "raw_vs_graded", cardSlug: "justin-herbert-2020-panini-prizm-325-value" },
];

export function rawMid(card: CardPage): number {
  return (card.rawValueLow + card.rawValueHigh) / 2;
}

/** Rough all-in grading cost (PSA tier + mail in/out) from typical raw comp mid. */
export function estimateAllInGradingCost(card: CardPage): {
  tierLabel: string;
  psaFee: number;
  shipping: number;
  total: number;
} {
  const mid = rawMid(card);
  if (mid >= 50_000) {
    return {
      tierLabel: "High-value / walkthrough-style (illustrative)",
      psaFee: 350,
      shipping: 80,
      total: 430,
    };
  }
  if (mid >= 5_000) {
    return { tierLabel: "Express / higher declared value", psaFee: 150, shipping: 45, total: 195 };
  }
  if (mid >= 500) {
    return { tierLabel: "Regular value tier", psaFee: 50, shipping: 25, total: 75 };
  }
  return { tierLabel: "Value / economy-style", psaFee: 25, shipping: 18, total: 43 };
}

export function netVsRawMid(card: CardPage, gradedValue: number): number {
  const { total } = estimateAllInGradingCost(card);
  return gradedValue - total - rawMid(card);
}

export function tier1Entry(
  template: Tier1Template,
  slug: string
): Tier1Entry | undefined {
  return TIER1_SEO_PAGES.find((e) => e.template === template && e.cardSlug === slug);
}

export function tier1Path(template: Tier1Template, cardSlug: string): string {
  if (template === "should_grade") return `/should-i-grade/${cardSlug}`;
  if (template === "psa10_value") return `/psa-10-value/${cardSlug}`;
  return `/raw-vs-graded/${cardSlug}`;
}

export function tier1Title(card: CardPage, template: Tier1Template): string {
  const base = card.title;
  if (template === "should_grade") return `Should I Grade ${base}?`;
  if (template === "psa10_value") return `${base} PSA 10 Value`;
  return `${base}: Raw vs Graded`;
}

export function tier1MetaDescription(card: CardPage, template: Tier1Template): string {
  const short = `${card.title}: raw ${card.rawValueLow}–${card.rawValueHigh}, PSA 9 ${card.psa9Value}, PSA 10 ${card.psa10Value}, ~${card.popCount.toLocaleString()} PSA pop.`;
  if (template === "should_grade") {
    return `Should you grade ${card.title}? ${short} Grading cost, ROI, and a clear grade/skip verdict.`;
  }
  if (template === "psa10_value") {
    return `${card.title} PSA 10 value & comps. ${short} Break-even vs grading fees.`;
  }
  return `${card.title} raw vs PSA graded prices. ${short} See ROI and when raw makes sense.`;
}

export function buildTier1Faqs(
  card: CardPage,
  template: Tier1Template
): { question: string; answer: string }[] {
  const mid = rawMid(card);
  const { total } = estimateAllInGradingCost(card);
  const worth = card.gradingVerdict === "worth_grading";
  const name = card.title;

  const core: { question: string; answer: string }[] = [
    {
      question: `What are recent raw comps for the ${name}?`,
      answer: `Typical raw sales fall around ${mid.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} at mid-range condition, with a wider band of ${card.rawValueLow.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}–${card.rawValueHigh.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} depending on eye appeal and seller.`,
    },
    {
      question: `What is a ${name} worth in PSA 9 vs PSA 10?`,
      answer: `Recent market guidance in our model: PSA 9 near ${card.psa9Value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} and PSA 10 near ${card.psa10Value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}. Realized prices vary by subgrade, eye appeal, and timing.`,
    },
    {
      question: `How many ${name} cards are in the PSA population report?`,
      answer: `We use an estimated ~${card.popCount.toLocaleString()} PSA-graded copies for this card (total graded). Higher pop usually means more liquidity but more competition for top grade.`,
    },
    {
      question: worth
        ? `Is the ${name} worth submitting to PSA?`
        : `Should I skip grading the ${name}?`,
      answer: worth
        ? `Usually yes for gem-quality copies: net upside after illustrative ${total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} all-in grading often beats selling raw at mid comps—if you believe the card can reach PSA 9+.`
        : `Often no for average raw copies: PSA fees and time eat most of the upside unless you have true gem condition. Selling raw or buying already graded is frequently simpler.`,
    },
  ];

  const extra =
    template === "should_grade"
      ? {
          question: `What break-even PSA grade should I target for ${name}?`,
          answer: `Compare your all-in cost (~${total.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}) to the jump from raw mid (~${mid.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}) to PSA 9 and PSA 10 in the table above. You need enough resale lift to clear that gap.`,
        }
      : template === "psa10_value"
        ? {
            question: `Why does ${name} PSA 10 trade at a premium?`,
            answer: `PSA 10 is the top bucket; demand concentrates there. For this card, the PSA 10 to PSA 9 spread reflects gem scarcity within a ~${card.popCount.toLocaleString()}-copy graded population.`,
          }
        : {
            question: `When is buying raw better than buying graded for ${name}?`,
            answer: `If you can inspect sharp corners/centering and buy below mid raw, you keep optionality. If you need liquidity or hate variance, graded inventory prices that risk into the ask.`,
          };

  return [...core, extra];
}
