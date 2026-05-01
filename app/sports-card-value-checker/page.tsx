import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageAttribution } from "@/components/PageAttribution";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import {
  cardPages,
  getCardsBySport,
  SPORT_ORDER,
  sportLabel,
  type CardSport,
} from "@/lib/cards";
import { formatUsd } from "@/lib/format-currency";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const canonical = `${base}/sports-card-value-checker`;
  const title = "Sports Card Value Checker | PSA, Raw & Grading ROI";
  const description =
    "Check sports card values before you grade or sell. Compare raw prices, PSA 9 values, PSA 10 upside, price history signals, and grading ROI.";

  return {
    title,
    description,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: `${title} | CardSnap`,
      description,
      url: canonical,
      type: "website",
      siteName: "CardSnap",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "CardSnap sports card value checker",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CardSnap`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

function SportIntentLabel({ sport }: { sport: CardSport }) {
  const labels: Partial<Record<CardSport, string>> = {
    baseball: "baseball card price checker",
    basketball: "basketball card price checker",
    football: "football card price checker",
  };
  return labels[sport] ?? `${sportLabel(sport)} card value lookup`;
}

export default function SportsCardValueCheckerPage() {
  const base = getSiteUrl();
  const bySport = getCardsBySport();
  const featured = cardPages
    .slice()
    .sort((a, b) => b.psa10Value - a.psa10Value)
    .slice(0, 8);
  const pageUrl = `${base}/sports-card-value-checker`;
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Sports Card Value Checker",
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description:
      "A sports card value lookup and grading ROI page for comparing raw, PSA 9, and PSA 10 prices.",
    mainEntity: {
      "@type": "ItemList",
      name: "Featured sports card value checks",
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
      <JsonLd data={itemListLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Sports Card Value Checker
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          Use CardSnap as a psa card value lookup before you grade, sell, or buy.
          Compare raw value, PSA 9 downside, PSA 10 upside, and grading fees so
          you can answer the real question: should I grade my card?
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            Check the value gap before you submit
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            PSA 10 comps can make almost any card look exciting. The safer move
            is checking raw value vs PSA 9 vs PSA 10, then subtracting grading
            costs. That is the sports card grading calculator logic CardSnap is
            built around.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:from-amber-300 hover:to-orange-400"
          >
            Analyze your card
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">
            Popular card value lookups
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featured.map((card) => (
              <Link
                key={card.slug}
                href={`/cards/${card.slug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600"
              >
                <span className="block text-sm font-medium text-zinc-100">
                  {card.title}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Raw {formatUsd(card.rawValueLow)}-{formatUsd(card.rawValueHigh)} - PSA 9{" "}
                  {formatUsd(card.psa9Value)} - PSA 10 {formatUsd(card.psa10Value)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-8">
          <h2 className="text-xl font-semibold text-white">
            Price check by market
          </h2>
          {SPORT_ORDER.map((sport) => {
            const cards = bySport[sport].slice(0, 4);
            if (cards.length === 0) return null;

            return (
              <div key={sport} className="border-t border-zinc-800 pt-5">
                <h3 className="text-base font-semibold text-white">
                  <SportIntentLabel sport={sport} />
                </h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Track the raw-to-graded spread before a card goes into your
                  sell pile, grading order, or sports card collection tracker.
                </p>
                <ul className="mt-3 divide-y divide-zinc-800">
                  {cards.map((card) => (
                    <li
                      key={card.slug}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <Link
                        href={`/cards/${card.slug}`}
                        className="text-sm font-medium text-zinc-200 hover:text-white hover:underline"
                      >
                        {card.playerName}
                      </Link>
                      <span className="text-xs text-zinc-500">
                        PSA 10 {formatUsd(card.psa10Value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            Price history and tracker direction
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Card values move. CardSnap is being built toward a sports card price tracker
            and sports card price history layer that connects recent comps, grade
            outcomes, and collection decisions. For now, the value guides and
            analyzer show the raw, PSA 9, PSA 10, and fee spread that drives the
            grading decision.
          </p>
          <Link
            href="/cards"
            className="mt-4 inline-flex text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Browse all value guides
          </Link>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            Pokemon card values
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Pokemon has its own hype cycle, grading risk, and collector demand.
            Use the Pokemon card value checker before treating a chase card like
            an investment.
          </p>
          <Link
            href="/pokemon-card-value-checker"
            className="mt-4 inline-flex text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Open Pokemon card value checker
          </Link>
        </section>
      </main>
    </div>
  );
}
