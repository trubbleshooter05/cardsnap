"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  upgrading: boolean;
};

export function ScanGate({ open, onClose, onUpgrade, upgrading }: Props) {
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
            {upgrading ? "Redirecting…" : "Unlock Pro — Stop Guessing"}
          </button>
          <p className="text-center text-xs leading-relaxed text-zinc-500">
            One unlocked scan pays for a full year of CardSnap.
          </p>
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
