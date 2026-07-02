"use client";

import { useState } from "react";
import Link from "next/link";
import type { MinGradeTarget, ScanResultPayload } from "@/lib/types";
import { formatUsd, formatUsdSigned } from "@/lib/format-currency";
import { computeGradingRoi } from "@/lib/roi";
import {
  assessCommunityPasteReadiness,
  formatPasteVerdict,
} from "@/lib/paste-verdict";
import { describeCompSource } from "@/lib/source-confidence";

type Props = {
  data: ScanResultPayload;
  scanId: string;
  /** When set (e.g. on home), clears the current result instead of relying on navigation. */
  onNewScan?: () => void;
};

function hasEbayPrice(avg: number | null | undefined): boolean {
  return avg != null && !Number.isNaN(avg);
}

function minGradeLabel(grade: MinGradeTarget): string {
  if (grade === "psa9") return "PSA 9";
  if (grade === "psa10") return "PSA 10";
  return "Does not break even at modeled grades";
}

const ESTIMATE_UPDATED_LABEL = "April 11, 2026";

export function ResultCard({ data, scanId, onNewScan }: Props) {
  const [copied, setCopied] = useState(false);
  const roi = data.roi ?? computeGradingRoi(data, undefined, data);
  const worth = roi.headlineVerdict === "grade";
  const psa = data.psa;
  const ebayOk = hasEbayPrice(data.ebay.avgSoldPrice);
  const comp = describeCompSource(data);
  const pasteReady = assessCommunityPasteReadiness({ ...data, roi });
  const loseReasons =
    roi.loseMoneyReasons.length > 0
      ? roi.loseMoneyReasons
      : computeGradingRoi(data, undefined, data).loseMoneyReasons;
  const headlineCardValue = Math.max(
    data.rawValueHigh,
    data.gradedPSA9Value,
    data.gradedPSA10Value
  );

  async function copyPasteReply() {
    if (!pasteReady.ok) return;
    const text = formatPasteVerdict({ ...data, roi });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

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

          <div className="mt-4 flex flex-wrap gap-2">
            <SourceBadge label="Raw" value={comp.rawLabel} />
            <SourceBadge label="Graded" value={comp.gradedLabel} />
            <SourceBadge label="Confidence" value={comp.overall} />
          </div>

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
            {roi.psa9PainCase ? (
              <p className="mt-2 text-center text-xs leading-snug text-amber-300/90">
                PSA 9 pain case: a 9 nets {formatUsdSigned(roi.netIfPSA9)} — headline
                assumes a 10.
              </p>
            ) : null}
            <p className="mt-2 text-center text-xs leading-snug text-zinc-400">
              Break-even (net ≥ $0): {minGradeLabel(roi.minGradeToBreakEven)}
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

          {loseReasons.length > 0 ? (
            <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
                Why this could lose money
              </p>
              <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-zinc-300">
                {loseReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>
          ) : null}

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
                label="eBay market"
                value={ebayOk ? formatUsd(data.ebay.avgSoldPrice) : "—"}
                sub={
                  ebayOk
                    ? comp.rawLabel
                    : "Using model estimate"
                }
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
                <span className="text-zinc-500">Raw source</span>
                <span className="text-right text-zinc-300">{comp.rawLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Graded source</span>
                <span className="text-right text-zinc-300">{comp.gradedLabel}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Last updated</span>
                <span className="text-right text-zinc-300">
                  {ESTIMATE_UPDATED_LABEL}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Confidence level</span>
                <span className="text-right text-zinc-300">{comp.overall}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500">Grade call bar</span>
                <span className="text-right text-zinc-300">
                  {minGradeLabel(roi.minGradeToRecommend)}
                </span>
              </div>
            </div>
            <p className="mt-2 text-zinc-500">
              {" "}
              <Link href="/methodology" className="text-amber-400/90 underline-offset-2 hover:underline">
                See methodology
              </Link>
              .
            </p>
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

          {!pasteReady.ok ? (
            <div className="mt-5 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100/90">
              <p className="font-semibold text-rose-200">Not ready for Reddit paste</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-100/80">
                {pasteReady.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
              {pasteReady.fixHints.length > 0 ? (
                <p className="mt-2 text-rose-100/70">
                  Try: {pasteReady.fixHints.join(" ")}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-rose-100/60">
                For threads like this, reply with questions or point to 130point — not model guesses.
              </p>
            </div>
          ) : null}

          <button
            type="button"
            onClick={copyPasteReply}
            disabled={!pasteReady.ok}
            className={`mt-5 flex h-12 w-full items-center justify-center rounded-xl border text-sm font-semibold transition ${
              pasteReady.ok
                ? "border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/15"
                : "cursor-not-allowed border-zinc-700 bg-zinc-900/50 text-zinc-500"
            }`}
          >
            {copied
              ? "Copied — paste in thread"
              : pasteReady.ok
                ? "Copy community reply (no link)"
                : "Fix search, then copy reply"}
          </button>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
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

function SourceBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/80 px-2.5 py-1 text-[10px] text-zinc-400">
      <span className="font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </span>
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
