"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onReportCheckout?: () => void;
  upgrading: boolean;
  reportCheckouting?: boolean;
};

export function ScanGate({
  open,
  onClose,
  onUpgrade,
  onReportCheckout,
  upgrading,
  reportCheckouting = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-gate-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl shadow-black/60 sm:p-8">
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
          Your next card could be worth $500+ graded — or nothing after fees if it misses gem. CardSnap Pro pays for itself on a single correct decision.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
            Founding price
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="text-3xl font-black tracking-tight text-white">$9/mo</span>
            <span className="pb-1 text-sm font-semibold text-amber-200">
              or $29/yr founding
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            Unlimited grading decisions, cancel anytime. The annual founding price is for early users.
          </p>
        </div>

        <ul className="mt-5 space-y-2.5">
          {[
            "See exact PSA 9 vs PSA 10 ROI before you pay",
            "Know the break-even grade before submitting",
            "Avoid the #1 grading mistake: only works at PSA 10",
            "Unlimited scans · Cancel anytime",
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
            onClick={onUpgrade}
            className="btn-amber flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
          >
            {upgrading ? "Redirecting…" : "Unlock Pro — $9/mo"}
          </button>
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            One unlocked scan pays for a full year of CardSnap.
          </p>
          {onReportCheckout ? (
            <button
              type="button"
              disabled={reportCheckouting}
              onClick={onReportCheckout}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-60"
            >
              {reportCheckouting ? "Redirecting…" : "Buy one report — $4.99"}
            </button>
          ) : null}
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
