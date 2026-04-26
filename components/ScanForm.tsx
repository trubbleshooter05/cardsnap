"use client";

type Props = {
  disabled?: boolean;
  progressMessage?: string;
  onSubmit: (payload: { cardName: string; condition: string }) => void;
};

const CONDITIONS = [
  { value: "Raw", label: "Raw" },
  { value: "Lightly Played", label: "Lightly Played" },
  { value: "Near Mint", label: "Near Mint" },
  { value: "Mint", label: "Mint" },
] as const;

export function ScanForm({ disabled, progressMessage, onSubmit }: Props) {
  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const cardName = String(fd.get("cardName") ?? "").trim();
        const condition = String(fd.get("condition") ?? "Raw");
        if (!cardName) return;
        onSubmit({ cardName, condition });
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cardName"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Card
        </label>
        <input
          id="cardName"
          name="cardName"
          type="text"
          required
          disabled={disabled}
          placeholder="e.g. 1986 Fleer Michael Jordan #57"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-base text-zinc-100 shadow-sm outline-none placeholder:text-zinc-600 transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="condition"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Condition
        </label>
        <select
          id="condition"
          name="condition"
          disabled={disabled}
          defaultValue="Raw"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800/80 px-4 py-3 text-base text-zinc-100 shadow-sm outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value} className="bg-zinc-900">
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="btn-amber mt-1 flex h-12 w-full items-center justify-center rounded-xl text-base font-bold shadow-lg shadow-amber-500/20"
      >
        {disabled ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            {progressMessage ?? "Analyzing card"}
          </span>
        ) : (
          "Analyze Card"
        )}
      </button>
    </form>
  );
}
