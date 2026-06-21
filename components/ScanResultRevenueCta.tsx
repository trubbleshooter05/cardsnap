"use client";

type Props = {
  onUpgradePro: () => void;
  onBuyScanPack: () => void;
  upgrading?: boolean;
  packBuying?: boolean;
};

export function ScanResultRevenueCta({
  onUpgradePro,
  onBuyScanPack,
  upgrading = false,
  packBuying = false,
}: Props) {
  const disabled = upgrading || packBuying;

  return (
    <div className="mt-4 w-full max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
      <p className="text-sm font-semibold leading-snug text-amber-100">
        Planning a PSA submission? Get unlimited scans.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={disabled}
          onClick={onUpgradePro}
          className="btn-amber flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {upgrading ? "Redirecting…" : "Upgrade to Pro"}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onBuyScanPack}
          className="flex h-11 flex-1 items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 text-sm font-semibold text-zinc-200 transition hover:border-amber-500/50 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {packBuying ? "Redirecting…" : "Buy Scan Pack"}
        </button>
      </div>
    </div>
  );
}
