"use client";

import Link from "next/link";
import type { ScanResultPayload } from "@/lib/types";
import { formatUsd } from "@/lib/format-currency";

type Props = {
  data: ScanResultPayload;
  scanId: string;
  /** When set (e.g. on home), clears the current result instead of relying on navigation. */
  onNewScan?: () => void;
};

function hasEbayPrice(avg: number | null | undefined): boolean {
  return avg != null && !Number.isNaN(avg);
}

export function ResultCard({ data, scanId, onNewScan }: Props) {
  const worth = data.worthGrading;
  const psa = data.psa;
  const ebayOk = hasEbayPrice(data.ebay.avgSoldPrice);

  return (
    <div className="w-full max-w-md">
      {/* Fixed dark palette so screenshots look consistent in light or dark OS theme */}
      <div
        className="relative overflow-hidden rounded-[1.25rem] border border-zinc-600/40 bg-zinc-950 text-zinc-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)] ring-1 ring-white/[0.06]"
        data-testid="scan-result-card"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
          aria-hidden
        />
        <div className="relative px-5 pb-6 pt-5 sm:px-7 sm:pb-7 sm:pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            CardSnap · Verdict
          </p>

          <h2 className="mt-3 text-[1.375rem] font-bold leading-tight tracking-tight text-white sm:text-2xl">
            {data.confirmedName}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
            {[data.year, data.player, data.set].filter(Boolean).join(" · ")}
          </p>

          <div
            className={`mt-6 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
              worth
                ? "border-emerald-500/35 bg-emerald-500/[0.08]"
                : "border-rose-500/35 bg-rose-500/[0.08]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
                  worth
                    ? "bg-emerald-500/25 text-emerald-300"
                    : "bg-rose-500/25 text-rose-300"
                }`}
                aria-hidden
              >
                {worth ? "✓" : "✕"}
              </span>
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    worth ? "text-emerald-400/90" : "text-rose-400/90"
                  }`}
                >
                  {worth ? "Worth grading" : "Skip grading"}
                </p>
                <p className="text-lg font-bold leading-snug text-white sm:text-xl">
                  {worth ? "Expected upside vs cost" : "Cost likely exceeds upside"}
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-zinc-300">
            {data.verdictReason}
          </p>

          <div className="mt-7 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Values
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <StatCell
                label="Raw range"
                value={`${formatUsd(data.rawValueLow)} – ${formatUsd(data.rawValueHigh)}`}
                highlight
              />
              <StatCell
                label="eBay comps"
                value={ebayOk ? formatUsd(data.ebay.avgSoldPrice) : "—"}
                sub={ebayOk ? "Recent listings avg" : "Add eBay API for live comps"}
                muted={!ebayOk}
              />
              <StatCell
                label="PSA 9"
                value={formatUsd(data.gradedPSA9Value)}
              />
              <StatCell
                label="PSA 10"
                value={formatUsd(data.gradedPSA10Value)}
              />
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-3.5 py-3 text-sm leading-snug text-zinc-400">
            {psa && (psa.psa9Pop != null || psa.psa10Pop != null) ? (
              <span className="text-zinc-300">
                <span className="text-zinc-500">PSA pop · </span>
                Grade 9:{" "}
                <span className="font-medium text-zinc-200 tabular-nums">
                  {psa.psa9Pop?.toLocaleString() ?? "—"}
                </span>
                <span className="text-zinc-600"> · </span>
                Grade 10:{" "}
                <span className="font-medium text-zinc-200 tabular-nums">
                  {psa.psa10Pop?.toLocaleString() ?? "—"}
                </span>
              </span>
            ) : (
              <span>Population data wasn&apos;t available for this search.</span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Link
              href={`/results/${scanId}`}
              className="flex h-12 flex-1 items-center justify-center rounded-xl bg-white text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-zinc-100"
            >
              Share link
            </Link>
            {onNewScan ? (
              <button
                type="button"
                onClick={onNewScan}
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-600 bg-transparent text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                New scan
              </button>
            ) : (
              <Link
                href="/"
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-600 bg-transparent text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                New scan
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCell({
  label,
  value,
  sub,
  highlight,
  muted,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-3.5 py-3 ${
        highlight
          ? "bg-zinc-800/90 ring-1 ring-white/[0.06]"
          : "bg-zinc-900/70 ring-1 ring-zinc-700/50"
      } ${muted ? "opacity-90" : ""}`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div
        className={`mt-1.5 text-base font-semibold tabular-nums tracking-tight ${
          muted ? "text-zinc-500" : "text-white"
        }`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[11px] leading-tight text-zinc-600">{sub}</div>
      ) : null}
    </div>
  );
}
