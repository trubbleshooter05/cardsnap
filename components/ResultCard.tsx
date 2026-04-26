"use client";

import Link from "next/link";
import type { ScanResultPayload } from "@/lib/types";
import { formatUsd, formatUsdSigned } from "@/lib/format-currency";
import { computeGradingRoi } from "@/lib/roi";

type Props = {
  data: ScanResultPayload;
  scanId: string;
  /** When set (e.g. on home), clears the current result instead of relying on navigation. */
  onNewScan?: () => void;
};

function hasEbayPrice(avg: number | null | undefined): boolean {
  return avg != null && !Number.isNaN(avg);
}

const ESTIMATE_UPDATED_LABEL = "April 11, 2026";

export function ResultCard({ data, scanId, onNewScan }: Props) {
  const roi = data.roi ?? computeGradingRoi(data);
  const worth = roi.headlineVerdict === "grade";
  const psa = data.psa;
  const ebayOk = hasEbayPrice(data.ebay.avgSoldPrice);
  const confidenceLevel =
    ebayOk && psa ? "High" : ebayOk || psa ? "Medium" : "Directional";
  const headlineCardValue = Math.max(
    data.rawValueHigh,
    data.gradedPSA9Value,
    data.gradedPSA10Value
  );

  return (
    <div className="w-full max-w-md">
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

          <div className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-3 text-center">
            <p className="text-sm font-semibold leading-snug text-amber-200">
              You could be sitting on a{" "}
              <span className="text-lg font-black tabular-nums text-white">
                {formatUsd(headlineCardValue)}
              </span>{" "}
              card
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 items-stretch gap-2 rounded-xl bg-zinc-900/70 p-2 ring-1 ring-zinc-800">
            <ValueStep label="Raw value" value={formatUsd(roi.rawLiquidationUsd)} />
            <ValueStep label="PSA 9" value={formatUsd(data.gradedPSA9Value)} />
            <ValueStep
              label="PSA 10"
              value={formatUsd(data.gradedPSA10Value)}
              highlight
            />
          </div>

          {/* ROI headline — screenshot-focused */}
          <div
            className={`mt-6 rounded-2xl border p-4 sm:p-5 ${
              worth
                ? "border-emerald-500/40 bg-emerald-500/[0.1]"
                : "border-rose-500/40 bg-rose-500/[0.1]"
            }`}
          >
            <p
              className={`text-center text-[11px] font-bold uppercase tracking-[0.25em] ${
                worth ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {worth ? "Grade it" : "Skip it"}
            </p>
            <p className="mt-2 text-center text-3xl font-black tabular-nums tracking-tight text-white sm:text-4xl">
              {formatUsdSigned(roi.headlineNetUsd)}
            </p>
            <p className="mt-1 text-center text-xs leading-snug text-zinc-500">
              Expected net if PSA 10 vs selling raw, after PSA fee &amp; est.
              shipping
            </p>
            <p className="mt-2 text-center text-xs leading-snug text-zinc-400">
              Based on recent market comps and grading outcomes
            </p>
          </div>

          <p className="mt-3 text-center text-xs text-amber-300/80">
            Card values fluctuate — this estimate may change
          </p>

          <div
            className={`mt-4 flex items-start gap-3 rounded-xl border p-3 ${
              worth
                ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                : "border-rose-500/25 bg-rose-500/[0.06]"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                worth
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300"
              }`}
              aria-hidden
            >
              {worth ? "✓" : "✕"}
            </span>
            <p className="text-[15px] leading-relaxed text-zinc-300">
              {data.verdictReason}
            </p>
          </div>

          <div className="mt-7 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Costs &amp; net scenarios
            </p>
            <div className="space-y-2 rounded-xl bg-zinc-900/80 p-3 text-sm text-zinc-400 ring-1 ring-zinc-800">
              <div className="flex justify-between gap-2">
                <span>Est. raw sale (mid)</span>
                <span className="font-medium tabular-nums text-zinc-200">
                  {formatUsd(roi.rawLiquidationUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>PSA grading fee (tier)</span>
                <span className="font-medium tabular-nums text-zinc-200">
                  {formatUsd(roi.psaGradingFeeUsd)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Est. shipping + insurance</span>
                <span className="font-medium tabular-nums text-zinc-200">
                  {formatUsd(roi.shippingInsuranceEstimateUsd)}
                </span>
              </div>
              <div className="border-t border-zinc-700 pt-2 font-medium text-zinc-300">
                <div className="flex justify-between gap-2">
                  <span>Net if PSA 9</span>
                  <span
                    className={`tabular-nums ${
                      roi.netIfPSA9 >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatUsdSigned(roi.netIfPSA9)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>Net if PSA 10</span>
                  <span
                    className={`tabular-nums ${
                      roi.netIfPSA10 >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatUsdSigned(roi.netIfPSA10)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
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
                sub={ebayOk ? "Recent listings avg" : "Live comps not configured"}
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

          <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
            Estimates only; PSA prices and fees change. Not financial advice.
          </p>

          <div className="mt-5 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-3.5 py-3 text-xs leading-relaxed text-zinc-400">
            <p className="font-semibold text-zinc-300">
              How this estimate was calculated
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Source type</span>
                <span className="text-right text-zinc-300">
                  {ebayOk ? "Live comps" : "Estimated comps"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Last updated</span>
                <span className="text-right text-zinc-300">
                  {ESTIMATE_UPDATED_LABEL}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Confidence level</span>
                <span className="text-right text-zinc-300">
                  {confidenceLevel}
                </span>
              </div>
            </div>
            {!ebayOk ? (
              <p className="mt-2 text-zinc-500">
                eBay live comps are not configured for this estimate.
              </p>
            ) : null}
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
                New analysis
              </button>
            ) : (
              <Link
                href="/"
                className="flex h-12 flex-1 items-center justify-center rounded-xl border border-zinc-600 bg-transparent text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900"
              >
                New analysis
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ValueStep({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-2.5 py-2 text-center ${
        highlight
          ? "bg-emerald-500/15 ring-1 ring-emerald-500/35"
          : "bg-zinc-950/60 ring-1 ring-zinc-800/80"
      }`}
    >
      <p
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          highlight ? "text-emerald-300" : "text-zinc-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-bold tabular-nums ${
          highlight ? "text-white" : "text-zinc-200"
        }`}
      >
        {value}
      </p>
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
