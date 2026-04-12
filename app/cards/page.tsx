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
import { AdSlot } from "@/components/AdSlot";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Sports Card Values & Grading Guide | CardSnap",
    description:
      "PSA 10 and raw value guides for iconic rookies and key cards — with grading verdicts and links to scan your own copy.",
    alternates: {
      canonical: `${base}/cards`,
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Sports card values &amp; grading guide
        </h1>
        <p className="mt-3 text-zinc-400">
          High-intent guides for rookies and grails. Open any card for values,
          population context, and a grading verdict — then{" "}
          <Link href="/" className="text-zinc-200 underline hover:text-white">
            scan your own copy
          </Link>
          .
        </p>
        <PageAttribution className="mt-4" />

        <div className="mt-8">
          <AdSlot />
        </div>

        <p className="mt-6 text-sm text-zinc-500">
          {cardPages.length} cards indexed
        </p>

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

        <div className="mt-10">
          <AdSlot />
        </div>
      </main>
    </div>
  );
}
