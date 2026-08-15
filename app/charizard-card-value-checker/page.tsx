import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageAttribution } from "@/components/PageAttribution";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getCardPageBySlug, getCardsBySport } from "@/lib/cards";
import { formatUsd } from "@/lib/format-currency";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const canonical = `${base}/charizard-card-value-checker`;
  const title = "Base Set Charizard PSA 9 vs PSA 10: Should I Grade It";
  const description =
    "Base Set Charizard PSA 9 versus PSA 10: CardSnap model raw, PSA 9, and PSA 10 figures, grading cost, and whether this holo is worth submitting.";

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

export default function CharizardCardValueCheckerPage() {
  const base = getSiteUrl();
  const charizard = getCardPageBySlug("charizard-base-set");
  const related = getCardsBySport().pokemon
    .filter((card) => card.slug !== "charizard-base-set")
    .slice(0, 4);
  const pageUrl = `${base}/charizard-card-value-checker`;
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Base Set Charizard PSA 9 vs PSA 10",
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description:
      "Base Set Charizard PSA 9 versus PSA 10 and whether grading is worth the fee.",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={pageLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Base Set Charizard PSA 9 vs PSA 10: Should I Grade It
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          This charizard card value checker is for the 1999 Base Set Charizard
          holo (#4) stored in CardSnap — not every Charizard print. Compare Raw vs PSA 9 vs PSA 10
          on that record, then decide if your copy is worth a submit.
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-8 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Which Base Set Charizard is this?</h2>
          <p>
            CardSnap’s stored record is titled {charizard ? charizard.title : "Charizard Base Set (1999)"}.
            First Edition, Shadowless, and Unlimited Base Set holos are different print runs.
            This page does not invent separate prices for each run. If your stamp or copyright
            line does not match the listing you are comparing, analyze your own card instead
            of using the snapshot below.
          </p>
        </section>

        {charizard ? (
          <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <h2 className="text-lg font-semibold text-white">
              {charizard.title} — CardSnap model snapshot
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              These figures are the app’s stored raw band, PSA 9, and PSA 10 values for this
              slug. They are not a live sold-comp feed.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Raw</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {formatUsd(charizard.rawValueLow)}-{formatUsd(charizard.rawValueHigh)}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">PSA 9</p>
                <p className="mt-1 text-lg font-bold text-white">
                  {formatUsd(charizard.psa9Value)}
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-zinc-950/50 p-4">
                <p className="text-xs uppercase tracking-wide text-amber-400">PSA 10</p>
                <p className="mt-1 text-lg font-bold text-amber-300">
                  {formatUsd(charizard.psa10Value)}
                </p>
              </div>
            </div>
            <Link
              href={`/cards/${charizard.slug}`}
              className="mt-4 inline-flex text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
            >
              Open the Base Set Charizard value record
            </Link>
          </section>
        ) : null}

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Grading cost and risk</h2>
          <p>
            PSA fees scale with declared value. CardSnap estimates all-in cost on the
            scan result. Holo scratches, whitening, and centering decide whether you
            land PSA 9 or miss it. If only a PSA 10 clears fees, you are making a gem bet.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            Should you grade this Base Set Charizard?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            On the stored snapshot, PSA 9 sits above the top of the raw band, so a
            clean holo can justify grading if you accept fee and time risk. A
            scratched or off-center copy should stay raw. Check the PSA 9 downside
            first. Analyze your Charizard card before you ship.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:from-amber-300 hover:to-orange-400"
          >
            Analyze your Charizard card
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">Related pages</h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-sm marker:text-amber-400">
            <li>
              <Link href="/cards/charizard-base-set" className="text-amber-400 underline">
                Charizard Base Set value record
              </Link>
            </li>
            <li>
              <Link href="/should-i-grade-victor-wembanyama-rookie-card" className="text-amber-400 underline">
                Victor Wembanyama rookie card value
              </Link>
            </li>
            <li>
              <Link href="/caitlin-clark-rookie-card-value" className="text-amber-400 underline">
                Caitlin Clark rookie card value
              </Link>
            </li>
            <li>
              <Link href="/should-i-grade/michael-jordan-1986-fleer-57-value" className="text-amber-400 underline">
                1986 Fleer Michael Jordan #57
              </Link>
            </li>
            <li>
              <Link href="/should-i-grade/lebron-james-2003-topps-chrome-111-value" className="text-amber-400 underline">
                2003 Topps Chrome LeBron James #111
              </Link>
            </li>
            <li>
              <Link href="/psa-9-vs-psa-10-worth-it" className="text-amber-400 underline">
                PSA 9 vs PSA 10 spread
              </Link>
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-white">
            Related Pokemon value checks
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((card) => (
              <Link
                key={card.slug}
                href={`/cards/${card.slug}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 hover:border-zinc-600"
              >
                <span className="block text-sm font-medium text-zinc-100">
                  {card.title}
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Raw {formatUsd(card.rawValueLow)}-{formatUsd(card.rawValueHigh)} - PSA 10{" "}
                  {formatUsd(card.psa10Value)}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-wrap gap-3 border-t border-zinc-800 pt-8">
          <Link
            href="/pokemon-card-value-checker"
            className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Pokemon card value checker
          </Link>
          <Link
            href="/pokemon-card-price-tracker"
            className="text-sm font-semibold text-zinc-200 hover:text-white hover:underline"
          >
            Pokemon card price tracker
          </Link>
        </section>
      </main>
    </div>
  );
}
