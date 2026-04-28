import type { Metadata } from "next";
import Link from "next/link";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getSiteUrl } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Sports Card Watchlist & Value Alerts | CardSnap",
    description:
      "Track cards you are deciding whether to grade, sell raw, or watch as PSA spreads change.",
    alternates: { canonical: `${base}/watchlist` },
    openGraph: {
      title: "Sports Card Watchlist & Value Alerts | CardSnap",
      description:
        "Track cards you are deciding whether to grade, sell raw, or watch as PSA spreads change.",
      url: `${base}/watchlist`,
      type: "website",
      siteName: "CardSnap",
    },
  };
}

const useCases = [
  "Cards where PSA 9 upside is close to grading cost",
  "Raw rookies you want to monitor before submitting",
  "High-pop cards where PSA 10 premiums move faster than raw comps",
];

export default function WatchlistPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Value alerts</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Sports card watchlist for grade, sell, or hold decisions
        </h1>
        <p className="mt-3 text-zinc-400">
          Use CardSnap to keep borderline cards visible while raw prices, PSA 9 spreads, and PSA 10 premiums
          change.
        </p>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-semibold text-white">What belongs on the watchlist?</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            {useCases.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <aside className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="font-semibold text-white">Start with a scan</p>
          <p className="mt-2 text-sm text-zinc-300">
            Scan a card first, then compare raw value, PSA 9 value, PSA 10 upside, and condition risk before
            deciding whether to submit.
          </p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-emerald-300 hover:text-emerald-200">
            Open CardSnap scanner →
          </Link>
        </aside>
      </main>
    </div>
  );
}
