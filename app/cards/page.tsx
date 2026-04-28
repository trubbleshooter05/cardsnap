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
    title: "Sports Card Values & Grading Guide | CardSnap",
    description:
      "Browse CardSnap's crawlable card value hub: raw prices, PSA 9 values, PSA 10 values, population context, and grading verdicts for important sports and Pokemon cards.",
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
      title: "Sports Card Values & Grading Guide | CardSnap",
      description:
        "Raw, PSA 9, and PSA 10 value guides with grading verdicts for important sports and Pokemon cards.",
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
      title: "Sports Card Values & Grading Guide | CardSnap",
      description:
        "Raw, PSA 9, and PSA 10 value guides with grading verdicts for important cards.",
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
    name: "CardSnap sports card value guides",
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
          Sports card values &amp; grading guide
        </h1>
        <p className="mt-3 text-zinc-400">
          A crawlable index of every CardSnap card value guide. Each page includes
          raw prices, PSA 9 and PSA 10 estimates, population context, grading
          math, related cards, and a clear grade-or-sell verdict. Open any card
          below, then{" "}
          <Link href="/" className="text-zinc-200 underline hover:text-white">
            scan your own copy
          </Link>
          .
        </p>
        <PageAttribution className="mt-4" />

        <p className="mt-6 text-sm text-zinc-500">
          {cardPages.length} canonical card guides indexed at getcardsnap.com/cards.
        </p>

        <section className="mt-8 border-y border-zinc-800 py-5">
          <h2 className="text-base font-semibold text-white">
            Popular card value guides
          </h2>
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
                  {sportLabel(sport)}
                </h2>
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

        <aside className="mt-14 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
          <p className="font-semibold text-white">Not listed?</p>
          <p className="mt-2 text-sm text-zinc-400">
            Use the scanner for any card name — raw comps, PSA tiers, and a
            verdict in seconds.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Go to scan →
          </Link>
        </aside>
      </main>
    </div>
  );
}
