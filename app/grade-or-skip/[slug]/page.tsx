import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { nicheContentMap } from "@/lib/niche-content";
import { GENERATED_NICHE_CONTENT } from "@/lib/generated-niche-content";
import { getSiteUrl } from "@/lib/site-url";

function getNicheData(slug: string) {
  const generated = GENERATED_NICHE_CONTENT as Record<string, (typeof GENERATED_NICHE_CONTENT)[keyof typeof GENERATED_NICHE_CONTENT]>;
  return nicheContentMap[slug] ?? generated[slug] ?? null;
}

export function generateStaticParams() {
  const slugs = new Set([
    ...Object.keys(nicheContentMap),
    ...Object.keys(GENERATED_NICHE_CONTENT),
  ]);
  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = getNicheData(params.slug);
  if (!data) return {};
  const siteUrl = getSiteUrl();
  return {
    title: data.seoTitle,
    description: data.seoDescription,
    alternates: {
      canonical: `/grade-or-skip/${params.slug}`,
    },
    openGraph: {
      title: data.seoTitle,
      description: data.seoDescription,
      url: `${siteUrl}/grade-or-skip/${params.slug}`,
      siteName: "CardSnap",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${data.sport} card grading ROI guide — CardSnap`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: data.seoTitle,
      description: data.seoDescription,
      images: ["/opengraph-image"],
    },
  };
}

export default function GradeOrSkipPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = getNicheData(params.slug);
  if (!data) notFound();

  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/grade-or-skip/${params.slug}`;

  const faqItems = [
    {
      question: `When should I grade my ${data.sport} card?`,
      answer: data.whenToGrade.join(" "),
    },
    {
      question: `When should I skip grading my ${data.sport} card?`,
      answer: data.skipGrading.join(" "),
    },
    ...data.roiExamples.map((ex) => ({
      question: `Is it worth grading ${ex.cardName}?`,
      answer: `${ex.reason} Raw value: $${ex.rawValue}. PSA 9 value: $${ex.psa9Value}. PSA 10 value: $${ex.psa10Value}. Verdict: ${ex.verdict}.`,
    })),
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Grade or Skip",
        item: `${siteUrl}/grade-or-skip`,
      },
      { "@type": "ListItem", position: 3, name: data.sport, item: pageUrl },
    ],
  };

  const verdictColor = (verdict: string) => {
    if (verdict === "strong") return "text-emerald-400";
    if (verdict === "moderate") return "text-amber-400";
    return "text-red-400";
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <nav className="text-sm text-zinc-500 mb-8 flex gap-2 items-center">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Grade or Skip</span>
          <span>/</span>
          <span className="text-zinc-300">{data.sport}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          {data.h1}
        </h1>
        <p className="text-zinc-400 text-lg mb-10">{data.subtitle}</p>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">
            Grading Logic
          </h2>
          <ul className="space-y-2">
            {data.gradingLogic.map((item, i) => (
              <li key={i} className="flex gap-3 text-zinc-300">
                <span className="text-amber-500 mt-1 shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">
            Key Characteristics
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {data.keyCharacteristics.map((kc, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <h3 className="font-semibold text-white mb-1">{kc.title}</h3>
                <p className="text-zinc-400 text-sm">{kc.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 grid sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-emerald-400 mb-3">
              When to Grade
            </h2>
            <ul className="space-y-2">
              {data.whenToGrade.map((item, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-400 mb-3">
              When to Skip
            </h2>
            <ul className="space-y-2">
              {data.skipGrading.map((item, i) => (
                <li key={i} className="flex gap-3 text-zinc-300 text-sm">
                  <span className="text-red-500 mt-0.5 shrink-0">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-amber-400 mb-4">
            ROI Examples
          </h2>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-zinc-400">
                <tr>
                  <th className="text-left px-4 py-3">Card</th>
                  <th className="text-right px-4 py-3">Raw</th>
                  <th className="text-right px-4 py-3">PSA 9</th>
                  <th className="text-right px-4 py-3">PSA 10</th>
                  <th className="text-center px-4 py-3">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {data.roiExamples.map((ex, i) => (
                  <tr
                    key={i}
                    className="border-t border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-200 font-medium">
                      <div>{ex.cardName}</div>
                      <div className="text-zinc-500 text-xs font-normal mt-0.5">
                        {ex.reason}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      ${ex.rawValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      ${ex.psa9Value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      ${ex.psa10Value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-semibold capitalize ${verdictColor(ex.verdict)}`}
                      >
                        {ex.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-amber-400 mb-3">
            Market Insight
          </h2>
          <p className="text-zinc-300 leading-relaxed">{data.marketInsight}</p>
        </section>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/"
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            ← Back to CardSnap
          </Link>
          <Link
            href="/guides"
            className="text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            View All Guides
          </Link>
        </div>
      </main>
    </>
  );
}
