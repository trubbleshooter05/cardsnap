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
  const title = "Charizard Card Value Checker | Raw, PSA 9 & PSA 10 Prices";
  const description =
    "Check Charizard card value before you buy, sell, or grade. Compare raw value, PSA 9 downside, PSA 10 upside, grading fees, and Pokemon price history signals.";

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
    name: "Charizard Card Value Checker",
    url: pageUrl,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    description:
      "Charizard card value checker for raw, PSA 9, PSA 10, and grading ROI decisions.",
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={pageLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Charizard Card Value Checker
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-zinc-300">
          Use this charizard card value checker before you buy, sell, or grade.
          Charizard hype is real, but the value still comes down to Raw vs PSA 9 vs PSA 10, condition, grading fees, and recent comps.
        </p>
        <PageAttribution className="mt-4" />

        {charizard ? (
          <section className="mt-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <h2 className="text-lg font-semibold text-white">
              {charizard.title} value snapshot
            </h2>
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
              Open full Charizard value guide
            </Link>
          </section>
        ) : null}

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">
            Do not grade on nostalgia alone
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            A Charizard card can be the most emotional card in the binder and
            still be a bad grading submission. Check the PSA 9 downside first.
            If the card only makes sense as a PSA 10, you are making a grading
            bet, not a clean investment decision.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-3 text-sm font-semibold text-zinc-950 hover:from-amber-300 hover:to-orange-400"
          >
            Analyze your Charizard card
          </Link>
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
