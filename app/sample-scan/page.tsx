import type { Metadata } from "next";
import Link from "next/link";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Sample Scan — See What CardSnap Gives You | CardSnap",
  description:
    "See exactly what a CardSnap grading analysis looks like before you use your free scan. Raw value, PSA 9, PSA 10, pop data, and a grade-or-skip verdict.",
  alternates: { canonical: `${getSiteUrl()}/sample-scan` },
};

function StatCell({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 ${
        highlight
          ? "bg-zinc-800/90 ring-1 ring-white/[0.06]"
          : "bg-zinc-900/70 ring-1 ring-zinc-700/50"
      }`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1.5 text-base font-semibold tabular-nums tracking-tight text-white">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[11px] leading-tight text-zinc-600">{sub}</div>
      )}
    </div>
  );
}

export default function SampleScanPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />

      <main className="mx-auto max-w-xl px-4 pb-20 pt-10 sm:pt-14">
        {/* Sample banner */}
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-amber-400">
            👀 This is a real sample scan result
          </p>
          <p className="mt-1 text-xs text-amber-200/70">
            This is exactly what you get when you scan a card. Run your own card free — no signup required.
          </p>
        </div>

        {/* Result card — mirrors ResultCard layout exactly */}
        <div className="w-full max-w-md mx-auto">
          <div className="relative overflow-hidden rounded-[1.25rem] border border-zinc-600/40 bg-zinc-950 text-zinc-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
              aria-hidden
            />
            <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                CardSnap · Verdict
              </p>

              <h2 className="mt-3 text-[1.375rem] font-bold leading-tight tracking-tight text-white sm:text-2xl">
                2020-21 Panini Prizm LaMelo Ball Base RC
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                2020 · LaMelo Ball · Panini Prizm
              </p>

              {/* Verdict — GRADE IT */}
              <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.1] p-4 sm:p-5">
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                  Grade it
                </p>
                <p className="mt-2 text-center text-3xl font-black tabular-nums tracking-tight text-white sm:text-4xl">
                  +$260
                </p>
                <p className="mt-1 text-center text-xs leading-snug text-zinc-500">
                  Expected net if PSA 10 vs selling raw, after PSA fee &amp; est. shipping
                </p>
              </div>

              {/* Verdict reason */}
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-base font-bold text-emerald-300" aria-hidden>
                  ✓
                </span>
                <p className="text-[15px] leading-relaxed text-zinc-300">
                  Strong PSA 10 upside at $380. Even a PSA 9 clears costs by ~$20. If the card looks pristine — clean centering, sharp corners — this submission makes financial sense.
                </p>
              </div>

              {/* Costs & net scenarios */}
              <div className="mt-7 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Costs &amp; net scenarios
                </p>
                <div className="space-y-2 rounded-xl bg-zinc-900/80 p-3 text-sm text-zinc-400 ring-1 ring-zinc-800">
                  <div className="flex justify-between gap-2">
                    <span>Est. raw sale (mid)</span>
                    <span className="font-medium tabular-nums text-zinc-200">$80</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>PSA grading fee (Value tier)</span>
                    <span className="font-medium tabular-nums text-zinc-200">$25</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span>Est. shipping + insurance</span>
                    <span className="font-medium tabular-nums text-zinc-200">$15</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 font-medium text-zinc-300">
                    <div className="flex justify-between gap-2">
                      <span>Net if PSA 9</span>
                      <span className="tabular-nums text-emerald-400">+$20</span>
                    </div>
                    <div className="mt-1 flex justify-between gap-2">
                      <span>Net if PSA 10</span>
                      <span className="tabular-nums text-emerald-400">+$260</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Values grid */}
              <div className="mt-5 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Values
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatCell label="Raw range" value="$65 – $95" highlight />
                  <StatCell
                    label="eBay comps"
                    value="$78"
                    sub="Recent listings avg"
                  />
                  <StatCell label="PSA 9" value="$140" />
                  <StatCell label="PSA 10" value="$380" />
                </div>
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
                Estimates only; PSA prices and fees change. Not financial advice.
              </p>

              {/* PSA pop */}
              <div className="mt-5 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-3.5 py-3 text-sm leading-snug text-zinc-400">
                <span className="text-zinc-300">
                  <span className="text-zinc-500">PSA pop · </span>
                  Grade 9:{" "}
                  <span className="font-medium tabular-nums text-zinc-200">1,847</span>
                  <span className="text-zinc-600"> · </span>
                  Grade 10:{" "}
                  <span className="font-medium tabular-nums text-zinc-200">312</span>
                </span>
              </div>

              {/* CTAs */}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                <Link
                  href="/"
                  className="flex h-12 flex-1 items-center justify-center rounded-xl bg-amber-400 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300"
                >
                  Scan your own card — free
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Below-card explanation */}
        <div className="mt-8 space-y-4 text-sm text-zinc-500">
          <p className="font-semibold text-zinc-300 text-base">What you&apos;re looking at:</p>
          <div className="space-y-3">
            {[
              ["Grade-or-skip verdict", "We run the actual ROI math and give you a clear answer: submit it, or sell raw."],
              ["PSA 9 vs PSA 10 net", "Most tools only show you PSA 10 upside. We show you what happens if it misses gem — because that's the real risk."],
              ["Costs baked in", "PSA fee tier, shipping, insurance — all subtracted before we show you the profit number."],
              ["eBay comps", "Real sold listings, not asking prices."],
              ["PSA population data", "How many copies already exist at each grade. High pop = compressed premiums."],
            ].map(([title, desc]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 shrink-0 text-amber-400">✓</span>
                <div>
                  <span className="font-medium text-zinc-300">{title} — </span>
                  <span>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-6 py-6 text-center">
          <p className="text-lg font-bold text-white">Ready to check your card?</p>
          <p className="mt-2 text-sm text-zinc-400">
            1 free scan. No signup. See your result in seconds.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-8 text-sm font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-300 hover:to-orange-400"
          >
            Scan your card free →
          </Link>
        </div>
      </main>
    </div>
  );
}
