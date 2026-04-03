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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-gate-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/60">
        {/* Icon */}
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
          <span className="text-2xl">⚡</span>
        </div>

        <h2
          id="scan-gate-title"
          className="text-xl font-bold text-white"
        >
          Free scans used up
        </h2>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          You&apos;ve used your 5 free scans this month. Upgrade to Pro for
          unlimited scans and priority analysis.
        </p>

        {/* Pro benefits */}
        <ul className="mt-4 space-y-2">
          {[
            "Unlimited card scans",
            "Full PSA population data",
            "Detailed ROI breakdown",
          ].map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="text-amber-400 font-bold">✓</span>
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            disabled={upgrading}
            onClick={onUpgrade}
            className="btn-amber flex h-12 w-full items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20"
          >
            {upgrading ? "Redirecting…" : "Upgrade to Pro — $9.99/mo"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-full items-center justify-center rounded-xl text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
