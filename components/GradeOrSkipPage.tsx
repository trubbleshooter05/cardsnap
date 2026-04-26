import Link from "next/link";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { PageAttribution } from "@/components/PageAttribution";
import { getNicheContent, getCategoryPath, getAllCategories } from "@/lib/niche-content";
import type { NicheContent } from "@/lib/niche-content";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

function RoiCard({
  example,
}: {
  example: NicheContent["roiExamples"][0];
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-white">{example.cardName}</h4>
          <p className="text-sm text-zinc-400 mt-1">{example.reason}</p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 ${
            example.verdict === "strong"
              ? "bg-emerald-500/20 text-emerald-300"
              : example.verdict === "moderate"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-rose-500/20 text-rose-300"
          }`}
        >
          {example.verdict === "strong"
            ? "Grade it"
            : example.verdict === "moderate"
              ? "Consider"
              : "Skip it"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded bg-zinc-800 p-3">
          <p className="text-xs text-zinc-500">Raw</p>
          <p className="mt-1 font-semibold text-white">${example.rawValue}</p>
        </div>
        <div className="rounded bg-zinc-800 p-3">
          <p className="text-xs text-zinc-500">PSA 9</p>
          <p className="mt-1 font-semibold text-white">${example.psa9Value}</p>
          <p className="mt-1 text-xs text-zinc-400">
            ROI: {example.psa9Roi > 0 ? "+" : ""}
            {Math.round((example.psa9Roi / example.rawValue) * 100)}%
          </p>
        </div>
        <div className="rounded bg-zinc-800 p-3">
          <p className="text-xs text-zinc-500">PSA 10</p>
          <p className="mt-1 font-semibold text-white">${example.psa10Value}</p>
          <p className="mt-1 text-xs text-zinc-400">
            ROI: {example.psa10Roi > 0 ? "+" : ""}
            {Math.round((example.psa10Roi / example.rawValue) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export function GradeOrSkipPage({
  category,
}: {
  category: "baseball" | "basketball" | "pokemon";
}) {
  const content = getNicheContent(category);
  const allCategories = getAllCategories();
  const otherCategories = allCategories.filter((c) => c !== category);
  const base = getSiteUrl();
  const pageUrl = `${base}${getCategoryPath(category)}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.h1,
    description: content.seoDescription,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    author: { "@type": "Organization", name: "CardSnap Research Team" },
    publisher: {
      "@type": "Organization",
      name: "CardSnap",
      "@id": `${base}/#organization`,
      url: base,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={articleLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        {/* Hero H1 */}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {content.h1}
        </h1>
        <p className="mt-3 text-lg text-zinc-300">
          {content.subtitle}
        </p>
        <PageAttribution className="mt-4" />

        <div className="mt-8">
          <AdSlot />
        </div>

        {/* Grading Logic */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">
            {content.sport} Card Grading Logic
          </h2>
          <div className="mt-4 space-y-3">
            {content.gradingLogic.map((logic, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <p className="text-sm text-zinc-300 leading-relaxed">{logic}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Key Characteristics */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">
            What Graders Look For
          </h2>
          <div className="mt-4 space-y-3">
            {content.keyCharacteristics.map((char) => (
              <div
                key={char.title}
                className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="min-w-fit">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-amber-400 to-orange-500">
                    <span className="text-xs font-bold text-black">✓</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{char.title}</p>
                  <p className="text-sm text-zinc-400 mt-1">{char.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROI Examples */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">
            Real-World ROI Examples
          </h2>
          <p className="mt-2 text-zinc-400">
            See what actual {content.sport.toLowerCase()} cards are worth raw vs. graded.
          </p>
          <div className="mt-6 space-y-4">
            {content.roiExamples.map((example) => (
              <RoiCard key={example.cardName} example={example} />
            ))}
          </div>
        </section>

        {/* When to Grade */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">
            When to Grade {content.sport} Cards
          </h2>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
              <h3 className="font-semibold text-emerald-300">✓ Grade Your Card If:</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {content.whenToGrade.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-5">
              <h3 className="font-semibold text-rose-300">✗ Skip Grading If:</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                {content.skipGrading.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Market Insight */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Market Insight</h2>
          <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-300 leading-relaxed">
              {content.marketInsight}
            </p>
          </div>
        </section>

        {/* Tool CTA */}
        <section className="mt-12 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Check Your Card&apos;s Value Now
          </h2>
          <p className="mt-2 text-zinc-300">
            Get real-time PSA comps, population data, and a personalized Grade&nbsp;it / Skip&nbsp;it verdict
            for your {content.sport.toLowerCase()} card.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-semibold text-black hover:from-amber-300 hover:to-orange-400 transition-colors"
          >
            Analyze Your Card Now →
          </Link>
          <p className="mt-3 text-xs text-zinc-500">
            1 free analysis. No signup required.
          </p>
        </section>

        {/* Related Pages */}
        <section className="mt-12 border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold text-white">Learn More</h2>
          <nav className="mt-4 space-y-2 text-sm">
            <Link
              href="/psa-grading-calculator"
              className="text-zinc-400 hover:text-zinc-200 underline block"
            >
              → PSA Grading Calculator — Detailed ROI breakdown
            </Link>
            {otherCategories.map((cat) => (
              <Link
                key={cat}
                href={getCategoryPath(cat)}
                className="text-zinc-400 hover:text-zinc-200 underline block"
              >
                → Should you grade {cat} cards?
              </Link>
            ))}
            <Link
              href="/cards"
              className="text-zinc-400 hover:text-zinc-200 underline block"
            >
              → Browse sports card values &amp; verdicts
            </Link>
          </nav>
        </section>

        <div className="mt-10">
          <AdSlot />
        </div>
      </main>
    </div>
  );
}
