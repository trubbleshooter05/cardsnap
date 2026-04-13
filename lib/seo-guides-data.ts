import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { SEO_GUIDE_DEFINITIONS_PHASE2 } from "@/lib/seo-guides-data-phase2";
import type { SeoGuideDefinition } from "@/lib/seo-guides-types";

export type {
  ExampleRow,
  SeoGuideBlock,
  SeoGuideDefinition,
  SeoGuideSection,
} from "@/lib/seo-guides-types";

export function seoGuidePath(slug: string): string {
  return `/${slug}`;
}

export function getSeoGuideBySlug(slug: string): SeoGuideDefinition | undefined {
  return SEO_GUIDE_DEFINITIONS.find((g) => g.slug === slug);
}

export function getAllSeoGuides(): SeoGuideDefinition[] {
  return SEO_GUIDE_DEFINITIONS;
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
    title: "Is Grading Cards Worth It in 2026?",
    description:
      "See whether grading sports cards is still worth it in 2026, and learn how to avoid losing money on weak submissions.",
    h1: "Is Grading Cards Worth It in 2026?",
    articleDescription:
      "When grading sports cards still makes sense in 2026 and how to avoid submissions that only work on a PSA 10.",
    intro: [
      "In 2026, grading is still worth it for some cards — but far fewer than most collectors think.",
      "The easy money is gone. Fees are real, competition is high, and a PSA 9 often does not leave much room for profit.",
    ],
    sections: [
      {
        title: "Why Grading Feels Harder Now",
        blocks: [
          {
            kind: "paragraph",
            text: "Collectors are more selective than before.",
          },
          {
            kind: "paragraph",
            text: "Many modern cards only make sense if they grade a PSA 10.",
          },
          {
            kind: "paragraph",
            text: "That means one grade point can completely change the outcome.",
          },
        ],
      },
      {
        title: "When Grading Still Makes Sense",
        blocks: [
          {
            kind: "paragraph",
            text: "Grading can still be worth it if:",
          },
          {
            kind: "bullet",
            items: [
              "The raw card was bought cheap",
              "The card has strong demand",
              "The PSA 10 premium is large",
              "The card has a real chance to gem",
            ],
          },
        ],
      },
      {
        title: "When Grading Usually Does Not Make Sense",
        blocks: [
          {
            kind: "paragraph",
            text: "Grading often does not make sense if:",
          },
          {
            kind: "bullet",
            items: [
              "The raw card is already expensive",
              "A PSA 9 barely beats the raw price",
              "Fees and shipping eat most of the upside",
              "You are sending cards just to hope for a 10",
            ],
          },
        ],
      },
    ],
    cta: {
      title: "The Smarter Way to Decide",
      blocks: [
        {
          kind: "paragraph",
          text: "Instead of guessing, compare:",
        },
        {
          kind: "bullet",
          items: [
            "Raw comps",
            "PSA 9 comps",
            "PSA 10 comps",
            "Your grading costs",
            "Your downside if the card misses gem",
          ],
        },
        { kind: "toolLink", lead: "Use this free tool:" },
        {
          kind: "paragraph",
          text: "It is built to help you decide before you submit.",
        },
      ],
      buttonText: "See If Grading Is Worth It",
    },
    finalSection: {
      title: "Final Takeaway",
      paragraphs: [
        "Yes, grading cards can still be worth it in 2026.",
        "But only when the numbers make sense.",
        "If the card needs a PSA 10 just to work, the risk is much higher than most people realize.",
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
];
