"use client";

type Props = {
  disabled?: boolean;
  onSubmit: (payload: { cardName: string; condition: string }) => void;
};

const CONDITIONS = [
  { value: "Raw", label: "Raw" },
  { value: "Lightly Played", label: "Lightly Played" },
  { value: "Near Mint", label: "Near Mint" },
  { value: "Mint", label: "Mint" },
] as const;

export function ScanForm({ disabled, onSubmit }: Props) {
  return (
    <form
      className="flex w-full max-w-md flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const cardName = String(fd.get("cardName") ?? "").trim();
        const condition = String(fd.get("condition") ?? "Raw");
        if (!cardName) return;
        onSubmit({ cardName, condition });
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Card
        <input
          name="cardName"
          type="text"
          required
          disabled={disabled}
          placeholder="e.g. 1986 Fleer Michael Jordan #57"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none ring-zinc-400 placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        Condition
        <select
          name="condition"
          disabled={disabled}
          defaultValue="Raw"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base text-zinc-900 shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/30 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={disabled}
        className="mt-1 flex h-12 w-full items-center justify-center rounded-lg bg-zinc-900 text-base font-semibold text-white shadow transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        Scan Card
      </button>
    </form>
  );
}
