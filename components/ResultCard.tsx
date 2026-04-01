"use client";

import Link from "next/link";
import type { ScanResultPayload } from "@/lib/types";
import { formatUsd } from "@/lib/format-currency";

type Props = {
  data: ScanResultPayload;
  scanId: string;
};

export function ResultCard({ data, scanId }: Props) {
  const worth = data.worthGrading;
  const psa = data.psa;

  return (
    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="text-xl font-bold leading-snug text-zinc-900 dark:text-zinc-50 sm:text-2xl">
        {data.confirmedName}
      </h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {[data.year, data.player, data.set].filter(Boolean).join(" · ")}
      </p>

      <div
        className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
          worth
            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
            : "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200"
        }`}
      >
        <span>{worth ? "Worth grading" : "Not worth grading"}</span>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {data.verdictReason}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/80">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Raw value
          </div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {formatUsd(data.rawValueLow)} – {formatUsd(data.rawValueHigh)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/80">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Recent eBay avg
          </div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {formatUsd(data.ebay.avgSoldPrice)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/80">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            PSA 9 value
          </div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {formatUsd(data.gradedPSA9Value)}
          </div>
        </div>
        <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/80">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            PSA 10 value
          </div>
          <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-100">
            {formatUsd(data.gradedPSA10Value)}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-zinc-200 p-3 text-sm text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
        {psa && (psa.psa9Pop != null || psa.psa10Pop != null) ? (
          <>
            PSA 9: {psa.psa9Pop?.toLocaleString() ?? "—"} copies graded · PSA
            10: {psa.psa10Pop?.toLocaleString() ?? "—"} copies graded
          </>
        ) : (
          <>Population data unavailable for this search.</>
        )}
      </div>

      <Link
        href={`/results/${scanId}`}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        Share result
      </Link>
    </div>
  );
}
