import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { SEO_GUIDE_DEFINITIONS_PHASE2 } from "@/lib/seo-guides-data-phase2";
import { SEO_GUIDE_DEFINITIONS_POKEMON } from "@/lib/seo-guides-data-pokemon";
import type { SeoGuideDefinition } from "@/lib/seo-guides-types";

export type {
  ExampleRow,
  SeoGuideBlock,
  SeoGuideDefinition,
  SeoGuideSection,
} from "@/lib/seo-guides-types";

const POKEMON_SLUGS = new Set(SEO_GUIDE_DEFINITIONS_POKEMON.map((g) => g.slug));

export function seoGuidePath(slug: string): string {
  if (POKEMON_SLUGS.has(slug)) return `/should-i-grade-pokemon/${slug}`;
  return `/${slug}`;
}

export function getSeoGuideBySlug(slug: string): SeoGuideDefinition | undefined {
  return SEO_GUIDE_DEFINITIONS.find((g) => g.slug === slug);
}

export function getAllSeoGuides(): SeoGuideDefinition[] {
  return SEO_GUIDE_DEFINITIONS;
}

/** Non-Pokémon guides only — used by the /guides index page */
export function getMainSeoGuides(): SeoGuideDefinition[] {
  return SEO_GUIDE_DEFINITIONS.filter((g) => !POKEMON_SLUGS.has(g.slug));
}

/** Pokémon guides only */
export function getPokemonSeoGuides(): SeoGuideDefinition[] {
  return SEO_GUIDE_DEFINITIONS_POKEMON;
}

export function buildSeoGuideMetadata(guide: SeoGuideDefinition): Metadata {
  const base = getSiteUrl();
  const canonical = `${base}${seoGuidePath(guide.slug)}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: canonical,
      type: "article",
      siteName: "CardSnap",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

export function buildSeoGuideArticleJsonLd(
  guide: SeoGuideDefinition
): Record<string, unknown> {
  const base = getSiteUrl();
  const canonical = `${base}${seoGuidePath(guide.slug)}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.h1,
    description: guide.articleDescription,
    author: { "@type": "Organization", name: "CardSnap Research Team" },
    publisher: {
      "@type": "Organization",
      name: "CardSnap",
      "@id": `${base}/#organization`,
      url: base,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
  };
}

/* eslint-disable max-len -- long-form SEO copy */
const SEO_GUIDE_DEFINITIONS: SeoGuideDefinition[] = [
  {
    slug: "should-i-grade-zion-williamson-rookie-card",
    title: "Should I Grade a Zion Williamson Rookie Card? (2026 Guide)",
    description:
      "See if grading a Zion Williamson rookie card is worth it. Compare PSA 9 vs PSA 10 profits and avoid losing money before you submit.",
    h1: "Should You Grade a Zion Williamson Rookie Card?",
    articleDescription:
      "Guide to PSA 9 vs PSA 10 economics for Zion Williamson rookie cards and when grading may or may not be worth it.",
    intro: [
      "If you're thinking about grading a Zion Williamson rookie card, you're not alone. A lot of collectors assume a PSA 10 will bring a big profit — but most cards don't grade a 10.",
      "The difference between a PSA 9 and PSA 10 can mean the difference between making money or losing it.",
    ],
    sections: [
      {
        title: "The Reality of Grading Zion Rookie Cards",
        blocks: [
          {
            kind: "paragraph",
            text: "Most modern cards — including Zion rookies — are extremely hard to gem.",
          },
          {
            kind: "paragraph",
            text: "Even small imperfections can drop a card to a PSA 9, which often sells for much less than expected.",
          },
          {
            kind: "paragraph",
            text: "That means grading is not a guarantee — it's a risk.",
          },
        ],
      },
      {
        title: "PSA 9 vs PSA 10 — Why It Matters",
        blocks: [
          { kind: "subhead", text: "Example:" },
          {
            kind: "exampleRows",
            rows: [
              { label: "Estimated raw value:", value: "$70", valueTone: "amber" },
              {
                label: "PSA 9 value:",
                value: "~$85 → barely break even (or loss after fees)",
                valueTone: "zinc",
              },
              {
                label: "PSA 10 value:",
                value: "~$180+ → strong profit",
                valueTone: "emerald",
              },
            ],
          },
          {
            kind: "paragraph",
            text: "If your card doesn't gem, you're likely losing money.",
          },
        ],
      },
      {
        title: "So… Should You Grade It?",
        blocks: [
          { kind: "subhead", text: "Only if:" },
          {
            kind: "bullet",
            items: [
              "The card looks extremely clean (centering, corners, edges)",
              "The PSA 10 price is significantly higher than raw",
              "You're okay with the risk of getting a PSA 9",
            ],
          },
          {
            kind: "paragraph",
            text: "Otherwise, selling raw is often the safer move.",
          },
        ],
      },
    ],
    cta: {
      title: "Check Before You Send (Free Tool)",
      blocks: [
        {
          kind: "paragraph",
          text: "Before submitting anything, you should check real comps and expected profit.",
        },
        { kind: "toolLink", lead: "Use this tool:" },
        { kind: "paragraph", text: "It compares:" },
        {
          kind: "bullet",
          items: ["Raw prices", "PSA 9 values", "PSA 10 values"],
        },
        {
          kind: "paragraph",
          text: "So you can decide BEFORE spending money on grading.",
        },
      ],
      buttonText: "Check Your Card Now",
    },
    finalSection: {
      title: "Final Takeaway",
      paragraphs: [
        "Grading a Zion Williamson rookie card can be profitable — but only if it gems.",
        "If it doesn't, you could lose money.",
        "Always check the numbers first.",
      ],
    },
  },
  {
    slug: "should-i-grade-victor-wembanyama-rookie-card",
    title: "Should I Grade a Victor Wembanyama Rookie Card? (2026 Guide)",
    description:
      "See if grading a Victor Wembanyama rookie card is worth it. Compare PSA 9 vs PSA 10 upside and check the risk before you submit.",
    h1: "Should You Grade a Victor Wembanyama Rookie Card?",
    articleDescription:
      "PSA 9 vs PSA 10 economics for Victor Wembanyama rookie cards and when grading is justified.",
    intro: [
      "Victor Wembanyama rookie cards have huge hype, which makes grading look tempting. On paper, a PSA 10 can look like easy profit.",
      "But most raw cards do not gem. Even a small issue with centering, edges, or corners can turn a big win into a weak return or a loss.",
    ],
    sections: [
      {
        title: "Why Wembanyama Rookie Cards Are Tricky",
        blocks: [
          {
            kind: "paragraph",
            text: "Wembanyama cards are exciting because PSA 10 prices can be much higher than raw prices.",
          },
          {
            kind: "paragraph",
            text: "That said, the spread between PSA 9 and PSA 10 is what matters most.",
          },
          {
            kind: "paragraph",
            text: "If your card gets a 9 instead of a 10, your expected profit can shrink fast.",
          },
        ],
      },
      {
        title: "PSA 9 vs PSA 10 Example",
        blocks: [
          { kind: "subhead", text: "Example:" },
          {
            kind: "paragraph",
            text: "Raw price: around $8 to $15",
          },
          {
            kind: "paragraph",
            text: "PSA 9: small gain or break even after fees",
          },
          {
            kind: "paragraph",
            text: "PSA 10: much stronger upside",
          },
          {
            kind: "paragraph",
            text: "That means grading only makes sense if the card has a real shot at gemming.",
          },
        ],
      },
      {
        title: "Should You Grade It?",
        blocks: [
          { kind: "subhead", text: "Grade it only if:" },
          {
            kind: "bullet",
            items: [
              "The card looks extremely sharp",
              "The PSA 10 premium is clearly worth the risk",
              "You are comfortable with the downside if it gets a PSA 9",
            ],
          },
          {
            kind: "paragraph",
            text: "If not, selling raw is often the safer choice.",
          },
        ],
      },
    ],
    cta: {
      title: "Check Before You Submit",
      blocks: [
        {
          kind: "paragraph",
          text: "Before sending any Wembanyama rookie card to PSA, compare raw prices, PSA 9 values, and PSA 10 values first.",
        },
        { kind: "toolLink", lead: "Use this free tool:" },
        {
          kind: "paragraph",
          text: "It helps you see whether grading is actually worth it before you spend money.",
        },
      ],
      buttonText: "Check Your Card Now",
    },
    finalSection: {
      title: "Final Takeaway",
      paragraphs: [
        "Wembanyama rookie cards can look like easy grading wins, but the real question is whether the card will gem.",
        "Always check the numbers first.",
      ],
    },
  },
  {
    slug: "psa-9-vs-psa-10-worth-it",
    title: "PSA 9 vs PSA 10: Is Grading Still Worth It?",
    description:
      "See why the difference between a PSA 9 and PSA 10 can decide whether grading a card makes money or loses money.",
    h1: "PSA 9 vs PSA 10: Is the Difference Really That Big?",
    articleDescription:
      "Why the PSA 9 vs PSA 10 spread drives grading profit and how to model downside before you submit.",
    intro: [
      "For most collectors, the biggest grading mistake is assuming a card will gem.",
      "In reality, the difference between a PSA 9 and PSA 10 often decides whether grading is profitable or not.",
    ],
    sections: [
      {
        title: "Why the Grade Spread Matters",
        blocks: [
          {
            kind: "paragraph",
            text: "A raw card might look like a great submission because the PSA 10 price is high.",
          },
          {
            kind: "paragraph",
            text: "But if the same card sells for much less as a PSA 9, the whole grading decision changes.",
          },
          {
            kind: "paragraph",
            text: "That is why grading is not just about upside. It is about risk.",
          },
        ],
      },
      {
        title: "Simple Example",
        blocks: [
          { kind: "subhead", text: "Example:" },
          {
            kind: "exampleRows",
            rows: [
              { label: "Raw value:", value: "$50", valueTone: "amber" },
              { label: "PSA 9 value:", value: "$65", valueTone: "zinc" },
              { label: "PSA 10 value:", value: "$180", valueTone: "emerald" },
              {
                label: "Grading + shipping costs:",
                value: "$30 to $40+",
                valueTone: "zinc",
              },
            ],
          },
          {
            kind: "paragraph",
            text: "If the card gets a 10, the math looks great.",
          },
          {
            kind: "paragraph",
            text: "If it gets a 9, the profit may disappear.",
          },
        ],
      },
      {
        title: "What Most People Miss",
        blocks: [
          {
            kind: "paragraph",
            text: "Many collectors compare only raw value to PSA 10 value.",
          },
          {
            kind: "paragraph",
            text: "That is the wrong comparison.",
          },
          {
            kind: "callout",
            text: 'The better question is: What happens if this gets a 9 instead of a 10?',
          },
        ],
      },
    ],
    cta: {
      title: "How to Make Better Grading Decisions",
      blocks: [
        {
          kind: "paragraph",
          text: "Before you submit, compare:",
        },
        {
          kind: "bullet",
          items: [
            "Raw value",
            "PSA 9 value",
            "PSA 10 value",
            "Fees",
            "Shipping",
            "Real downside risk",
          ],
        },
        { kind: "toolLink", lead: "Use this free tool:" },
        {
          kind: "paragraph",
          text: "It helps you see the difference before you spend money.",
        },
      ],
      buttonText: "Check PSA 9 vs PSA 10",
    },
    finalSection: {
      title: "Final Takeaway",
      paragraphs: [
        "The gap between PSA 9 and PSA 10 is often the entire grading decision.",
        "If a PSA 9 barely works, you are gambling on a gem.",
      ],
    },
  },
  {
    slug: "is-grading-cards-worth-it-2026",
    title: "Is Grading Cards Worth It in 2026? (Honest Answer + ROI Examples)",
    description:
      "Is grading cards worth it in 2026? We break down PSA fees, real ROI examples, when to grade vs sell raw, and the math most collectors get wrong.",
    h1: "Is Grading Cards Worth It in 2026?",
    articleDescription:
      "A complete 2026 guide to whether card grading is worth it — covering PSA fee changes, ROI calculator examples, case studies, and the PSA 9 trap that costs most collectors money.",
    intro: [
      "Short answer: grading is still worth it in 2026, but for fewer cards than most collectors think — and the math has gotten harder, not easier.",
      "PSA fees went up. Secondary market competition is higher. A PSA 9 on a modern card often does not leave enough room after fees to justify the submission. If you are grading in 2026, you need to know the exact numbers before you send anything.",
    ],
    sections: [
      {
        title: "2026 PSA Fee Changes: What You Are Actually Paying",
        blocks: [
          {
            kind: "paragraph",
            text: "PSA updated its pricing structure in recent years and the impact on ROI is significant. Understanding the fee tiers is step one before any grading decision.",
          },
          {
            kind: "paragraph",
            text: "As of 2026, PSA's Value tier (for cards declared under $499) runs approximately $25–$30 per card including basic service. Economy tier for cards declared $499+ is $75+ per card. Express and above starts at $150+ per submission. Shipping, insurance, and return fees add $15–$30 depending on your location and submission size.",
          },
          {
            kind: "paragraph",
            text: "That means for a typical modern card submission, your all-in cost is $40–$60 per card at minimum. That number must come out of your profit margin before you see a dollar.",
          },
          {
            kind: "callout",
            text: "Rule of thumb: your PSA 9 outcome must clear $50–$60 above raw value just to break even. If it does not, the submission only makes money at PSA 10.",
          },
        ],
      },
      {
        title: "The ROI Math Most Collectors Get Wrong",
        blocks: [
          {
            kind: "paragraph",
            text: "Here is the mistake: collectors compare raw value to PSA 10 value and declare the submission profitable. That is not the right comparison. You need to run the PSA 9 scenario first, because that is the most common outcome.",
          },
          {
            kind: "subhead",
            text: "Example 1: Modern Prizm Rookie (the most common grading scenario)",
          },
          {
            kind: "exampleRows",
            rows: [
              { label: "Raw card value:", value: "$80", valueTone: "amber" },
              { label: "All-in grading cost (PSA Value + shipping):", value: "$55", valueTone: "zinc" },
              { label: "PSA 9 resale:", value: "$105 → profit: $105 − $80 − $55 = −$30 loss", valueTone: "zinc" },
              { label: "PSA 10 resale:", value: "$290 → profit: $290 − $80 − $55 = +$155 profit", valueTone: "emerald" },
            ],
          },
          {
            kind: "paragraph",
            text: "On a PSA 9, you lose $30. On a PSA 10, you make $155. The submission is only worth it if your card has a genuine shot at gem — not just a hope.",
          },
          {
            kind: "subhead",
            text: "Example 2: Vintage key (when grading math works better)",
          },
          {
            kind: "exampleRows",
            rows: [
              { label: "Raw card value:", value: "$400", valueTone: "amber" },
              { label: "All-in grading cost (PSA Economy + shipping):", value: "$100", valueTone: "zinc" },
              { label: "PSA 8 resale:", value: "$550 → profit: $550 − $400 − $100 = +$50", valueTone: "amber" },
              { label: "PSA 9 resale:", value: "$900 → profit: $900 − $400 − $100 = +$400", valueTone: "emerald" },
            ],
          },
          {
            kind: "paragraph",
            text: "On vintage keys, even a lower grade can still clear costs because the authentication and slab premium is real. This is why vintage cards often justify grading when modern cards do not.",
          },
          {
            kind: "subhead",
            text: "Example 3: Common base card (when grading is almost never worth it)",
          },
          {
            kind: "exampleRows",
            rows: [
              { label: "Raw card value:", value: "$12", valueTone: "amber" },
              { label: "All-in grading cost:", value: "$50", valueTone: "zinc" },
              { label: "PSA 10 resale:", value: "$55 → profit: $55 − $12 − $50 = −$7 loss", valueTone: "zinc" },
            ],
          },
          {
            kind: "paragraph",
            text: "Even a perfect PSA 10 does not cover costs on a cheap base card. This is the most common way collectors lose money: sending high volumes of low-value cards hoping the graded premium will appear.",
          },
        ],
      },
      {
        title: "When Grading Is Worth It in 2026",
        blocks: [
          {
            kind: "paragraph",
            text: "There are still cards that justify grading. The pattern is consistent across sports cards and Pokémon alike.",
          },
          {
            kind: "bullet",
            items: [
              "The raw card was purchased significantly below the current market ceiling — you have cost basis room to absorb a PSA 9.",
              "The PSA 10 premium is at least 3× the raw value, giving meaningful upside that survives the PSA 9 downside.",
              "The card has a realistic gem rate — centering, corners, edges, and surface hold up under magnification, not just a quick sleeve check.",
              "Demand for graded copies is deep: there are multiple PSA 9 and PSA 10 recent sales, not just one outlier comp.",
              "Even a PSA 9 outcome clears all costs and leaves some profit — the submission does not bet everything on gem.",
            ],
          },
        ],
      },
      {
        title: "When Grading Is Not Worth It in 2026",
        blocks: [
          {
            kind: "paragraph",
            text: "These are the red flags that experienced collectors have learned to recognize — usually after losing money first.",
          },
          {
            kind: "bullet",
            items: [
              "The raw card is already priced near the PSA 9 comp. You are paying fees to add authentication to a card the market is already treating as near-mint.",
              "Only the PSA 10 outcome makes money. This is the most common grading trap. If the PSA 9 path is a loss, you are placing a bet, not making an investment.",
              "You are sending a bulk of modern base cards hoping for PSA 10s. Print runs are enormous, gem rates are low, and the math almost never works.",
              "You need the money back soon. Turnaround times even on Value tier can be 30–90 days. Tying up $400 in a slow market while waiting on grades is a real cost.",
              "The market for this card is thinly traded. If there are only 2–3 graded sales in the last 90 days, your comp data is unreliable and resale is uncertain.",
            ],
          },
        ],
      },
      {
        title: "Real Case Studies: Grade or Skip?",
        blocks: [
          {
            kind: "subhead",
            text: "Case Study 1: 2023 Panini Prizm Wembanyama Base — Skip",
          },
          {
            kind: "paragraph",
            text: "Raw market: $30–$45. PSA 9 market: $60–$75. PSA 10 market: $200–$300. All-in grading cost: $55. PSA 9 profit: break-even at best. PSA 10 profit: strong. Verdict: only submit if the card is genuinely pristine. Send it raw otherwise — the raw market is liquid and you lose nothing.",
          },
          {
            kind: "subhead",
            text: "Case Study 2: 1999 Pokémon Charizard Base Set Unlimited — Grade",
          },
          {
            kind: "paragraph",
            text: "Raw market (HP/good): $400–$800. PSA 6: $1,200+. PSA 8: $3,000+. PSA 9: $8,000+. All-in grading cost: $100–$150. Even a PSA 6 generates significant profit. Authentication and grade clarity add enormous value that raw buyers discount. This is the category where grading still works clearly: vintage keys with deep graded markets.",
          },
          {
            kind: "subhead",
            text: "Case Study 3: 2021 Topps Chrome Shohei Ohtani Base Auto — Grade carefully",
          },
          {
            kind: "paragraph",
            text: "Raw market: $150–$200. PSA 9: $250–$300. PSA 10: $700–$900. All-in grading cost: $100 (Economy tier on a high-value auto). PSA 9 profit: $0–$50 after fees. PSA 10 profit: $400–$600. Verdict: only if the auto placement and card condition are both exceptional. A borderline copy should be sold raw.",
          },
        ],
      },
      {
        title: "Pokémon vs Sports Cards: Different Markets, Same Math",
        blocks: [
          {
            kind: "paragraph",
            text: "Pokémon grading follows the same ROI logic as sports cards but the market dynamics differ in a few important ways.",
          },
          {
            kind: "paragraph",
            text: "Pokémon cards — especially vintage Base Set and Sword & Shield alt arts — have seen explosive PSA 10 premiums. A Moonbreon (Umbreon VMAX Alt Art) raw sells for $300–$400. A PSA 10 regularly sells for $800–$1,200+. That is the kind of spread that can justify grading even with a risk of missing gem.",
          },
          {
            kind: "paragraph",
            text: "However, the Pokémon market is also more volatile. PSA 10 prices can swing 30–40% in a few months based on trends and tournament play. Always use recent comps — not the record sale from 18 months ago.",
          },
        ],
      },
      {
        title: "The Grading Decision Checklist for 2026",
        blocks: [
          {
            kind: "paragraph",
            text: "Before submitting any card in 2026, run through this checklist:",
          },
          {
            kind: "bullet",
            items: [
              "What is today's raw value? (Not asking price — recent sold comps.)",
              "What is the PSA 9 resale in the last 60 days? (Not the best sale — the average.)",
              "What is the PSA 10 resale in the last 60 days?",
              "What is my all-in grading cost including shipping and insurance?",
              "Does the PSA 9 outcome clear my cost basis plus fees and leave profit?",
              "Have I inspected this card under magnification and strong light — not just in a sleeve?",
              "Is the graded market for this card deep enough to resell without a 30–60 day wait?",
            ],
          },
          {
            kind: "paragraph",
            text: "If the PSA 9 answer is no — the submission only works at PSA 10 — treat it as a high-variance bet and size the risk accordingly. It may still be worth it, but you should know what you are doing.",
          },
        ],
      },
    ],
    cta: {
      title: "Run the Numbers Before You Submit",
      blocks: [
        {
          kind: "paragraph",
          text: "CardSnap is built specifically for this decision. Enter your card and instantly see raw vs PSA 9 vs PSA 10 estimates, grading ROI, and a grade-or-skip verdict based on the actual math.",
        },
        {
          kind: "paragraph",
          text: "We don't grade your card. We tell you if it's worth grading.",
        },
        { kind: "toolLink", lead: "Try it free:" },
      ],
      buttonText: "Check If Grading Is Worth It",
    },
    finalSection: {
      title: "Final Takeaway",
      paragraphs: [
        "Yes, grading cards is still worth it in 2026 — for the right cards.",
        "The cards that justify grading share a common trait: the PSA 9 outcome is still profitable, not just the PSA 10. If you need gem to make money, you are betting on variance, not managing risk.",
        "Know your fees, run the PSA 9 scenario first, and only submit cards where the math holds up without the perfect grade.",
      ],
    },
  },
  {
    slug: "how-to-tell-if-a-card-will-grade-10",
    title: "How to Tell If a Card Will Grade a PSA 10",
    description:
      "Learn how collectors estimate whether a sports card has a real shot at grading PSA 10 before sending it in.",
    h1: "How to Tell If a Card Will Grade a PSA 10",
    articleDescription:
      "How to inspect cards and compare PSA 9 vs PSA 10 economics before paying grading fees.",
    intro: [
      "No one can guarantee a PSA 10 before submission.",
      "But you can still improve your odds by checking the card carefully and comparing the risk before you send it in.",
    ],
    sections: [
      {
        title: "Start With the Basics",
        blocks: [
          {
            kind: "paragraph",
            text: "Look closely at:",
          },
          {
            kind: "bullet",
            items: [
              "Centering",
              "Corners",
              "Edges",
              "Surface",
              "Print lines",
              "Scratches",
              "Whitening",
            ],
          },
          {
            kind: "paragraph",
            text: "Even a small flaw can drop a card from a 10 to a 9.",
          },
        ],
      },
      {
        title: "Why Most Cards Do Not Gem",
        blocks: [
          {
            kind: "paragraph",
            text: "A lot of cards look clean at first glance.",
          },
          {
            kind: "paragraph",
            text: "But once you inspect them more harshly, problems show up.",
          },
          {
            kind: "paragraph",
            text: "That is why experienced collectors often assume a lower grade first and only submit cards that still make sense.",
          },
        ],
      },
      {
        title: "Think in Terms of Risk",
        blocks: [
          {
            kind: "paragraph",
            text: "Do not ask: Can this be a PSA 10?",
          },
          {
            kind: "paragraph",
            text: "Ask: What happens if this gets a PSA 9?",
          },
          {
            kind: "paragraph",
            text: "If the answer is that you lose money, the submission is much riskier.",
          },
        ],
      },
    ],
    cta: {
      title: "Use the Numbers Too",
      blocks: [
        {
          kind: "paragraph",
          text: "Condition matters, but math matters too.",
        },
        {
          kind: "paragraph",
          text: "Before sending a card in, compare:",
        },
        {
          kind: "bullet",
          items: [
            "Raw value",
            "PSA 9 value",
            "PSA 10 value",
            "Grading fee",
            "Shipping and insurance",
          ],
        },
        { kind: "toolLink", lead: "Use this free tool:" },
        {
          kind: "paragraph",
          text: "It helps you see whether the submission makes sense before you pay to grade.",
        },
      ],
      buttonText: "Check Your Card First",
    },
    finalSection: {
      title: "Final Takeaway",
      paragraphs: [
        "You cannot predict a PSA 10 with certainty.",
        "But you can avoid bad submissions by checking condition carefully and making sure the math still works if the card misses gem.",
      ],
    },
  },
  ...SEO_GUIDE_DEFINITIONS_PHASE2,
  ...SEO_GUIDE_DEFINITIONS_POKEMON,
];
