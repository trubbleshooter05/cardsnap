type Props = { label?: string };

export function AdSlot({ label = "Advertisement" }: Props) {
  return (
    <aside
      className="flex h-28 items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-xs text-zinc-500"
      aria-hidden
    >
      {label}
    </aside>
  );
}
