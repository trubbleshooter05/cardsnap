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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-gate-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2
          id="scan-gate-title"
          className="text-lg font-bold text-zinc-900 dark:text-zinc-50"
        >
          You&apos;ve used your 5 free scans this month
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          $9.99/month for unlimited scans
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Not now
          </button>
          <button
            type="button"
            disabled={upgrading}
            onClick={onUpgrade}
            className="h-11 rounded-lg bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {upgrading ? "Redirecting…" : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
