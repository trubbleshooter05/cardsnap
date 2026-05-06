import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageAttribution } from "@/components/PageAttribution";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getCardsBySport, sportLabel, type CardSport } from "@/lib/cards";
import { formatUsd } from "@/lib/format-currency";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

const SPORT = "basketball" as CardSport;
const SPORT_LABEL = "Basketball";
const PATH = "/basketball-card-value-checker";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const title = `${SPORT_LABEL} Card Value Checker | Raw, PSA 9 & PSA 10`;
  const description = `Check ${SPORT_LABEL.toLowerCase()} card values before you grade or sell. Compare raw value, PSA 9 downside, PSA 10 upside, and grading ROI.`;

  return {
    title,
    description,
    alternates: { canonical: `${base}${PATH}` },
    openGraph: { title: `${title} | CardSnap`, description, url: `${base}${PATH}`, type: "website", siteName: "CardSnap" },
  };
}

export default function SportCardValueCheckerPage() {
  const base = getSiteUrl();
  const cards = getCardsBySport()[SPORT].slice().sort((a, b) => b.psa10Value - a.psa10Value);
  const featured = cards.slice(0, 8);
  const pageUrl = `${base}${PATH}`;
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SPORT_LABEL} Card Value Checker`,
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description: `${SPORT_LABEL} card value lookup for raw, PSA 9, PSA 10, and grading ROI decisions.`,
    mainEntity: {
      "@type": "ItemList",
      name: `Featured ${SPORT_LABEL} card value checks`,
      itemListElement: featured.map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${base}/cards/${card.slug}`,
        name: card.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={pageLd} />
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {SPORT_LABEL} Card Value Checker
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          Check {SPORT_LABEL.toLowerCase()} card values before you grade, sell, or buy. Compare raw value, PSA 9 downside, PSA 10 upside, and grading fees so you can decide whether the card is worth submitting.
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white">Run the grading math first</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            The PSA 10 number is only useful if the PSA 9 outcome and grading fee still make sense. CardSnap keeps the decision grounded in raw comps, graded values, and realistic downside.
          </p>
          <Link href="/" className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:from-amber-300 hover:to-orange-400">
            Analyze your card
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Popular {SPORT_LABEL.toLowerCase()} value lookups</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featured.map((card) => (
              <Link key={card.slug} href={`/cards/${card.slug}`} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600">
                <span className="block text-sm font-medium text-zinc-100">{card.title}</span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Raw {formatUsd(card.rawValueLow)}-{formatUsd(card.rawValueHigh)} - PSA 9 {formatUsd(card.psa9Value)} - PSA 10 {formatUsd(card.psa10Value)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">How to use this {SPORT_LABEL.toLowerCase()} card price checker</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Start with the raw range, compare PSA 9 and PSA 10 outcomes, subtract grading cost, then ask whether the card needs an unusually clean grade to make money. If the answer is yes, it is a grading bet, not a clean investment.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/sports-card-value-checker" className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline">All sports card values</Link>
            <Link href="/psa-grading-calculator" className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline">PSA grading calculator</Link>
            <Link href={`/grade-or-skip/${SPORT}`} className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline">{sportLabel(SPORT)} grade-or-skip guide</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
