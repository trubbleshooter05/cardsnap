"use client";

import { useState } from "react";

export type SubscriptionPlanToggle = "annual" | "monthly";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubscribe: (plan: SubscriptionPlanToggle) => void;
  onPackPurchase: (credits: 10 | 50 | 200) => void;
  upgrading: boolean;
  packBuying: Partial<Record<10 | 50 | 200, boolean>>;
  onReportCheckout?: () => void;
  reportCheckouting?: boolean;
};

export function ScanGate({
  open,
  onClose,
  onSubscribe,
  onPackPurchase,
  upgrading,
  packBuying,
  onReportCheckout,
  reportCheckouting = false,
}: Props) {
  const [plan, setPlan] = useState<SubscriptionPlanToggle>("annual");

  if (!open) return null;

  const subscribeLabel =
    plan === "annual"
      ? "Subscribe — $99/yr unlimited"
      : "Subscribe — $9.99/mo unlimited";

  return (
    <div
      className="fixed inset-0 z-50 flex max-h-[100dvh] items-end justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-gate-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/60 sm:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/15">
          <span className="text-2xl">⚠️</span>
        </div>

        <h2
          id="scan-gate-title"
          className="text-xl font-bold tracking-tight text-white sm:text-2xl"
        >
          Don&apos;t submit blind — one bad grade costs $50+
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Your next card could be worth $500+ graded — or nothing after fees if it misses gem.
          CardSnap Pro pays for itself on a single correct decision.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Unlimited grading
          </p>
          <div className="mt-3 flex rounded-xl border border-zinc-600/80 bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => setPlan("annual")}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                plan === "annual"
                  ? "bg-amber-500/25 text-amber-100 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Annual
              <span className="block text-xs font-normal text-zinc-500">
                $99/yr · best value
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition ${
                plan === "monthly"
                  ? "bg-amber-500/25 text-amber-100 shadow-inner"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Monthly
              <span className="block text-xs font-normal text-zinc-500">
                $9.99/mo
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-zinc-400">
            Unlimited scans either way — yearly saves vs paying monthly ($99/yr vs
            about $120/yr at $9.99/mo).
          </p>
        </div>

        <ul className="mt-5 space-y-2.5">
          {[
            "See exact PSA 9 vs PSA 10 ROI before you pay",
            "Know the break-even grade before submitting",
            "Avoid the #1 grading mistake: only works at PSA 10",
            "No subscription needed — scan packs from $9.99 or a single report for $4.99 below",
          ].map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span className="mt-0.5 font-bold text-amber-400">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={upgrading}
            onClick={() => onSubscribe(plan)}
            className="btn-amber flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
          >
            {upgrading ? "Redirecting…" : subscribeLabel}
          </button>
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            One unlocked scan pays for a full year of CardSnap.
          </p>

          {onReportCheckout ? (
            <button
              type="button"
              disabled={reportCheckouting}
              onClick={onReportCheckout}
              className="w-full text-center text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-300 disabled:opacity-60"
            >
              {reportCheckouting
                ? "Redirecting…"
                : "Just need this one? Get a single report for $4.99 — no account needed."}
            </button>
          ) : null}

          <div className="mt-5 border-t border-zinc-700/80 pt-5">
            <p className="text-center text-xs font-bold uppercase tracking-wider text-zinc-500">
              Or buy scans only (no subscription)
            </p>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                disabled={Boolean(packBuying[10])}
                onClick={() => onPackPurchase(10)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-60"
              >
                <span>10 scans</span>
                <span className="text-amber-200">$9.99</span>
              </button>
              <button
                type="button"
                disabled={Boolean(packBuying[50])}
                onClick={() => onPackPurchase(50)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-60"
              >
                <span>50 scans</span>
                <span className="text-amber-200">$29</span>
              </button>
              <button
                type="button"
                disabled={Boolean(packBuying[200])}
                onClick={() => onPackPurchase(200)}
                className="flex h-11 w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-60"
              >
                <span>200 scans</span>
                <span className="text-amber-200">$79</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-xl text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
