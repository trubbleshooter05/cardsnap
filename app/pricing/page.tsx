import type { Metadata } from "next";
import Link from "next/link";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();

export const metadata: Metadata = {
  title: "CardSnap Pricing — Pro Grading Decisions",
  description:
    "CardSnap pricing: 5 free card scans, prepaid scan packs, or unlimited grading decisions with monthly or annual Pro.",
  alternates: { canonical: `${base}/pricing` },
  openGraph: {
    title: "CardSnap Pricing — Pro Grading Decisions",
    description:
      "Start with 5 free scans, then choose scan packs or unlimited Pro (monthly or annual).",
    url: `${base}/pricing`,
    siteName: "CardSnap",
    type: "website",
  },
};

const features = [
  "Unlimited grade-or-sell decisions",
  "PSA 9 and PSA 10 break-even math",
  "Raw value, graded value, and estimated net after fees",
  "Watchlist workflow for borderline cards",
  "Card value guides and grading education",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-400">
            CardSnap Pro
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Stop guessing before you pay to grade a card.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Run 5 free scans, then pick prepaid scan packs or unlimited Pro. Built
            for collectors who want a clear grade, sell, or watch decision before
            spending on PSA fees.
          </p>
        </div>

        <section className="mt-10 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
              Unlimited Pro
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
              <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                <span className="text-5xl font-black tracking-tight text-white">$99</span>
                <span className="pb-2 text-lg font-semibold text-zinc-300">/yr</span>
              </div>
              <div className="flex flex-wrap items-end gap-x-2 gap-y-1 border-l border-amber-500/30 pl-6">
                <span className="text-4xl font-black tracking-tight text-white">$9.99</span>
                <span className="pb-2 text-lg font-semibold text-zinc-300">/mo</span>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Stripe shows the exact price before checkout. Yearly is less than twelve months billed monthly (~$120/yr).
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-orange-400"
            >
              Analyze 5 cards free
            </Link>

            <p className="mt-3 text-center text-xs text-zinc-500">
              No signup required for free scans. Upgrade when the math matters.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8">
            <h2 className="text-lg font-bold text-white">What Pro unlocks</h2>
            <ul className="mt-5 space-y-3">
              {features.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                  <span className="mt-0.5 shrink-0 font-bold text-amber-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">Scan packs — no subscription</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Signed-in checkout: add prepaid scans when you prefer pay-as-you-go.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["10 scans", "$9.99"],
              ["50 scans", "$29"],
              ["200 scans", "$79"],
            ].map(([label, price]) => (
              <li
                key={label}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-4"
              >
                <p className="text-lg font-bold text-white">{price}</p>
                <p className="mt-1 text-sm text-zinc-400">{label}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
          <h2 className="text-xl font-bold text-white">Why collectors pay</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              ["One miss costs real money", "A PSA submission can burn $50+ before you know whether the card had enough upside."],
              ["PSA 10 is not the whole story", "CardSnap shows the PSA 9 miss scenario so you are not betting only on gem mint."],
              ["The decision is fast", "Use the scanner before a show, eBay purchase, or grading order."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <h3 className="font-semibold text-zinc-100">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
