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
  const canonical = `${base}/pokemon-card-value-checker`;
  const title = "Pokemon Card Value Checker | Raw, PSA 9 & PSA 10 Prices";
  const description =
    "Check Pokemon card values before you buy, sell, or grade. Compare raw value, PSA 9 downside, PSA 10 upside, price history signals, and grading ROI.";

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
          alt: "CardSnap Pokemon card value checker",
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

export default function PokemonCardValueCheckerPage() {
  const base = getSiteUrl();
  const pokemonCards = getCardsBySport().pokemon
    .slice()
    .sort((a, b) => b.psa10Value - a.psa10Value);
  const featured = pokemonCards.slice(0, 8);
  const pageUrl = `${base}/pokemon-card-value-checker`;
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pokemon Card Value Checker",
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description:
      "Pokemon card value lookup for raw, PSA 9, PSA 10, price history, and grading ROI decisions.",
    mainEntity: {
      "@type": "ItemList",
      name: "Featured Pokemon card value checks",
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
          Pokemon Card Value Checker
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          Pokemon cards are physical, scarce, and emotional. That does not mean
          every hyped card is a smart buy or a smart grading submission. Before you treat Pokemon cards like an investment, check the raw vs PSA 9 vs PSA 10 math first.
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            Check comps before you chase the hype
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            A Pokemon collection can look valuable on camera, but the money is
            in the spread: raw value, PSA 9 downside, PSA 10 upside, grading
            fees, and demand. CardSnap helps you start with the numbers instead
            of the story.
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
            Popular Pokemon value lookups
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Use these as starting points for a charizard card value checker,
            chase-card lookup, or Pokemon grading decision.
          </p>
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

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-base font-semibold text-white">
              Pokemon card price tracker
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Watch the raw-to-graded spread before a card becomes a bad entry.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-base font-semibold text-white">
              Pokemon card price history
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Recent comps matter more than old screenshots or viral claims.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <h2 className="text-base font-semibold text-white">
              Pokemon card collection tracker
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Start with the cards most likely to drive total collection value.
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            The simple Pokemon grading rule
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            If the PSA 10 price is exciting but the PSA 9 outcome loses money,
            the card is not an investment thesis. It is a grading bet. Use
            CardSnap to compare the realistic outcome before you buy the hype or
            pay the grading fee.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/pokemon-card-grading-calculator"
              className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
            >
              Pokemon card grading calculator
            </Link>
            <Link
              href="/charizard-card-value-checker"
              className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
            >
              Charizard card value checker
            </Link>
            <Link
              href="/pokemon-card-price-tracker"
              className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
            >
              Pokemon card price tracker
            </Link>
            <Link
              href="/sports-card-value-checker"
              className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
            >
              Compare all card markets
            </Link>
            <Link
              href="/psa-grading-calculator"
              className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
            >
              Open the grading calculator
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
