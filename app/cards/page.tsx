import type { Metadata } from "next";
import Link from "next/link";
import {
  cardPages,
  getCardsBySport,
  SPORT_ORDER,
  sportLabel,
  type CardSport,
} from "@/lib/cards";
import { formatUsd } from "@/lib/format-currency";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Sports Card Value Checker — Raw, PSA 9 & PSA 10 Prices | CardSnap",
    description:
      "Use CardSnap's sports card value checker to compare raw prices, PSA 9 values, PSA 10 values, price history signals, and grading ROI before you submit.",
    alternates: {
      canonical: `${base}/cards`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    openGraph: {
      title: "Sports Card Value Checker | CardSnap",
      description:
        "Check raw, PSA 9, and PSA 10 sports card values with grading verdicts for important baseball, football, basketball, and Pokemon cards.",
      url: `${base}/cards`,
      siteName: "CardSnap",
      type: "website",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "CardSnap sports card value guides",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sports Card Value Checker | CardSnap",
      description:
        "Compare raw, PSA 9, and PSA 10 prices before you grade or sell.",
      images: ["/opengraph-image"],
    },
  };
}

function VerdictBadge({ verdict }: { verdict: "worth_grading" | "skip_grading" }) {
  const ok = verdict === "worth_grading";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
        ok
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-rose-500/20 text-rose-300"
      }`}
    >
      {ok ? "Worth grading" : "Skip grading"}
    </span>
  );
}

export default function CardsIndexPage() {
  const bySport = getCardsBySport();
  const base = getSiteUrl();
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "CardSnap sports card value checker",
    url: `${base}/cards`,
    numberOfItems: cardPages.length,
    itemListElement: cardPages.map((card, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${base}/cards/${card.slug}`,
      name: card.title,
      description: card.metaDescription,
    })),
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={itemListLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Sports Card Value Checker
        </h1>
        <p className="mt-3 text-zinc-400">
          Look up raw value, PSA 9 value, PSA 10 upside, population context, and
          grading ROI before you decide whether to sell raw or submit. Start with
          a known card below, then{" "}
          <Link href="/" className="text-zinc-200 underline hover:text-white">
            Analyze your card
          </Link>
          {" "}for a card-specific grading verdict.
        </p>
        <PageAttribution className="mt-4" />

        <p className="mt-6 text-sm text-zinc-500">
          {cardPages.length} canonical value guides indexed at getcardsnap.com/cards,
          with baseball card price checker, football card price checker,
          basketball card price checker, and Pokemon value lookup coverage.
        </p>

        <section className="mt-8 border-y border-zinc-800 py-5">
          <h2 className="text-base font-semibold text-white">
            Popular sports card price checks
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Each guide shows raw vs graded value, the PSA 9 downside, PSA 10
            upside, and the sports card grading calculator math behind the
            verdict.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {cardPages
              .slice()
              .sort((a, b) => b.psa10Value - a.psa10Value)
              .slice(0, 6)
              .map((card) => (
                <Link
                  key={card.slug}
                  href={`/cards/${card.slug}`}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600"
                >
                  <span className="block text-sm font-medium text-zinc-100">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    Raw {formatUsd(card.rawValueLow)}-{formatUsd(card.rawValueHigh)} · PSA 10{" "}
                    {formatUsd(card.psa10Value)}
                  </span>
                </Link>
              ))}
          </div>
        </section>

        <div className="mt-10 space-y-12">
          {SPORT_ORDER.map((sport: CardSport) => {
            const list = bySport[sport];
            if (list.length === 0) return null;
            return (
              <section key={sport}>
                <h2 className="border-b border-zinc-800 pb-2 text-xl font-semibold text-white">
                  {sportLabel(sport)} card price checker
                </h2>
                <p className="mt-3 text-sm text-zinc-500">
                  Compare recent raw and PSA value ranges before you grade,
                  sell, or add the card to a collection tracker.
                </p>
                <ul className="mt-4 divide-y divide-zinc-800">
                  {list.map((c) => (
                    <li
                      key={c.slug}
                      className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <Link
                          href={`/cards/${c.slug}`}
                          className="font-medium text-zinc-100 hover:text-white hover:underline"
                        >
                          {c.playerName}
                        </Link>
                        <p className="text-sm text-zinc-500">
                          {c.year} {c.brand} {c.setName} #{c.cardNumber}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <span className="text-sm text-zinc-400">
                          PSA 10 {formatUsd(c.psa10Value)}
                        </span>
                        <VerdictBadge verdict={c.gradingVerdict} />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <section className="mt-12 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            Price history and tracker signals
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            CardSnap is moving toward a sports card price tracker layer: raw
            comps, PSA 9 comps, PSA 10 comps, grading fees, and price history
            signals in one place. Today, use the value guides and analyzer to
            compare the spread that matters most before you grade.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-full border border-zinc-700 px-3 py-1">
              sports card price history
            </span>
            <span className="rounded-full border border-zinc-700 px-3 py-1">
              sports card price tracker
            </span>
            <span className="rounded-full border border-zinc-700 px-3 py-1">
              sports card collection tracker
            </span>
          </div>
        </section>

        <aside className="mt-14 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="font-semibold text-white">Not listed?</p>
          <p className="mt-2 text-sm text-zinc-400">
            Use CardSnap for any card name — raw comps, PSA tiers, grading fees,
            and a verdict in seconds.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Analyze your card →
          </Link>
        </aside>
      </main>
    </div>
  );
}
