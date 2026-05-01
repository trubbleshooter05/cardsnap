import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageAttribution } from "@/components/PageAttribution";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getCardsBySport } from "@/lib/cards";
import { formatUsd } from "@/lib/format-currency";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const canonical = `${base}/pokemon-card-price-tracker`;
  const title = "Pokemon Card Price Tracker | Raw, PSA 9 & PSA 10 History";
  const description =
    "Track Pokemon card prices by comparing raw value, PSA 9 downside, PSA 10 upside, price history signals, and grading ROI before you buy or submit.";

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | CardSnap`,
      description,
      url: canonical,
      type: "website",
      siteName: "CardSnap",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | CardSnap`,
      description,
    },
  };
}

export default function PokemonCardPriceTrackerPage() {
  const base = getSiteUrl();
  const pokemonCards = getCardsBySport().pokemon
    .slice()
    .sort((a, b) => b.psa10Value - a.psa10Value);
  const pageUrl = `${base}/pokemon-card-price-tracker`;
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pokemon Card Price Tracker",
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description:
      "Pokemon card price tracker for raw, PSA 9, PSA 10, price history, and collection value decisions.",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={pageLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Pokemon Card Price Tracker
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          Track Pokemon card prices by watching the raw-to-graded spread. The
          useful signal is not just a viral PSA 10 screenshot. It is raw value,
          PSA 9 downside, PSA 10 upside, grading fees, and Pokemon card price history.
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            Start with the cards that move collection value
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            A Pokemon card collection tracker should not treat every binder card
            the same. Start with the cards where raw, PSA 9, and PSA 10 values
            actually change the decision to hold, sell, or grade.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:from-amber-300 hover:to-orange-400"
          >
            Analyze your Pokemon card
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">
            Pokemon price tracker watchlist
          </h2>
          <div className="mt-4 divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/40">
            {pokemonCards.map((card) => (
              <Link
                key={card.slug}
                href={`/cards/${card.slug}`}
                className="flex flex-col gap-2 p-4 hover:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="block text-sm font-medium text-zinc-100">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    Raw {formatUsd(card.rawValueLow)}-{formatUsd(card.rawValueHigh)} - PSA 9{" "}
                    {formatUsd(card.psa9Value)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-amber-300">
                  PSA 10 {formatUsd(card.psa10Value)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            What to track before buying Pokemon hype
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-400">
            <li>Raw sold comps, not only graded asking prices.</li>
            <li>PSA 9 value, because many clean-looking cards do not gem.</li>
            <li>PSA 10 upside after grading fees and selling costs.</li>
            <li>Whether the card helps or hurts your total collection value.</li>
          </ul>
        </section>

        <section className="mt-12 flex flex-wrap gap-3 border-t border-zinc-800 pt-8">
          <Link
            href="/pokemon-card-value-checker"
            className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Pokemon card value checker
          </Link>
          <Link
            href="/charizard-card-value-checker"
            className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Charizard card value checker
          </Link>
        </section>
      </main>
    </div>
  );
}
