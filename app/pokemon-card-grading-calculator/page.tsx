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
  const canonical = `${base}/pokemon-card-grading-calculator`;
  const title = "Pokemon Card Grading Calculator | PSA ROI Checker";
  const description =
    "Check if your Pokemon card is worth grading. Compare raw value, PSA 9 downside, PSA 10 upside, grading fees, and realistic ROI before you submit.";

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
          alt: "CardSnap Pokemon card grading calculator",
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

export default function PokemonCardGradingCalculatorPage() {
  const base = getSiteUrl();
  const pokemonCards = getCardsBySport().pokemon
    .slice()
    .sort((a, b) => b.psa10Value - a.psa10Value);
  const featured = pokemonCards.slice(0, 6);
  const pageUrl = `${base}/pokemon-card-grading-calculator`;
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pokemon Card Grading Calculator",
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description:
      "Pokemon card grading calculator for raw value, PSA 9 downside, PSA 10 upside, grading fees, and ROI decisions.",
    mainEntity: {
      "@type": "ItemList",
      name: "Pokemon card grading ROI examples",
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
          Pokemon Card Grading Calculator
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          Before you pay PSA grading fees, check the part most collectors skip:
          what happens if your Pokemon card comes back PSA 9 instead of PSA 10.
          Compare raw value, PSA 9 downside, PSA 10 upside, and grading cost
          before you submit.
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            Should I grade my Pokemon card?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Grading is usually worth considering when the PSA 9 value still
            clears your raw value plus fees, and the PSA 10 outcome creates
            enough upside to justify the risk. If the math only works at PSA 10,
            the card may be a grading bet, not a smart submission.
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
            Pokemon grading ROI examples
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Use these examples to compare raw value against PSA 9 and PSA 10
            outcomes before paying a grading fee.
          </p>
          <div className="mt-4 space-y-3">
            {featured.map((card) => (
              <Link
                key={card.slug}
                href={`/cards/${card.slug}`}
                className="block rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-600"
              >
                <span className="block text-sm font-semibold text-zinc-100">
                  {card.title}
                </span>
                <span className="mt-2 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
                  <span>Raw: {formatUsd(card.rawValueLow)}-{formatUsd(card.rawValueHigh)}</span>
                  <span>PSA 9: {formatUsd(card.psa9Value)}</span>
                  <span className="font-semibold text-amber-300">
                    PSA 10: {formatUsd(card.psa10Value)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            The grading calculator rule
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
            <li>1. Start with the realistic raw value, not the best listing you saw.</li>
            <li>2. Subtract grading fees and shipping from the PSA 9 outcome.</li>
            <li>3. Treat PSA 10 as upside, not the default expectation.</li>
            <li>4. Skip cards where PSA 9 barely beats raw or loses money.</li>
          </ul>
        </section>

        <section className="mt-10 grid gap-3 sm:grid-cols-2">
          <Link
            href="/pokemon-card-value-checker"
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm font-semibold text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Pokemon card value checker
          </Link>
          <Link
            href="/charizard-card-value-checker"
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm font-semibold text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Charizard card value checker
          </Link>
          <Link
            href="/pokemon-card-price-tracker"
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm font-semibold text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Pokemon card price tracker
          </Link>
          <Link
            href="/psa-grading-calculator"
            className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm font-semibold text-zinc-200 hover:border-zinc-600 hover:text-white"
          >
            Sports card grading calculator
          </Link>
        </section>
      </main>
    </div>
  );
}
