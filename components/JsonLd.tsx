/**
 * JsonLd — injects JSON-LD structured data into the page <head>.
 * Usage: <JsonLd data={schemaObject} />
 */

interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://cardsnap.io"
).replace(/\/$/, "");

export function gradeOrSkipSchema(
  slug: string,
  sport: string,
  seoTitle: string,
  seoDescription: string,
  faqItems?: { q: string; a: string }[]
) {
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      "headline": seoTitle,
      "description": seoDescription,
      "url": `${BASE_URL}/grade-or-skip/${slug}`,
      "author": { "@type": "Organization", "name": "CardSnap" },
      "publisher": {
        "@type": "Organization",
        "name": "CardSnap",
        "url": BASE_URL
      },
      "about": {
        "@type": "Thing",
        "name": `${sport} Card Grading`
      }
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
        { "@type": "ListItem", "position": 2, "name": "Grade or Skip", "item": `${BASE_URL}/grade-or-skip` },
        { "@type": "ListItem", "position": 3, "name": `${sport} Cards` }
      ]
    }
  ];

  if (faqItems && faqItems.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "mainEntity": faqItems.map((item) => ({
        "@type": "Question",
        "name": item.q,
        "acceptedAnswer": { "@type": "Answer", "text": item.a }
      }))
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export function cardDetailSchema(card: {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  playerName: string;
  year: number;
  brand: string;
  sport: string;
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "headline": card.metaTitle,
        "description": card.metaDescription,
        "url": `${BASE_URL}/cards/${card.slug}`,
        "author": { "@type": "Organization", "name": "CardSnap" },
        "publisher": { "@type": "Organization", "name": "CardSnap", "url": BASE_URL },
        "about": {
          "@type": "Thing",
          "name": card.title,
          "description": `${card.year} ${card.brand} ${card.playerName} trading card`
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
          { "@type": "ListItem", "position": 2, "name": "Cards", "item": `${BASE_URL}/cards` },
          { "@type": "ListItem", "position": 3, "name": card.title }
        ]
      }
    ]
  };
}

export function calculatorSchema(seoTitle: string, seoDescription: string) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "PSA Grading ROI Calculator",
        "applicationCategory": "FinanceApplication",
        "description": seoDescription,
        "url": `${BASE_URL}/psa-grading-calculator`,
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "operatingSystem": "Web"
      },
      {
        "@type": "WebPage",
        "name": seoTitle,
        "url": `${BASE_URL}/psa-grading-calculator`,
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
            { "@type": "ListItem", "position": 2, "name": "PSA Grading Calculator" }
          ]
        }
      }
    ]
  };
}
