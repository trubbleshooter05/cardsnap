type Props = { label?: string };

/**
 * Display-ad mount point. Does not render unless `NEXT_PUBLIC_CARD_AD_SLOTS=1` is set —
 * avoids empty bordered boxes that hurt SEO page quality and CLS perception.
 *
 * Future: hydrate this node with AdSense/Media.net; reserve `min-height` only when loading real creatives.
 */
export function areCardAdSlotsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CARD_AD_SLOTS === "1";
}

export function AdSlot({ label = "Advertisement" }: Props) {
  if (!areCardAdSlotsEnabled()) {
    return null;
  }

  return (
    <aside
      className="advertisement-slot mx-auto w-full max-w-[728px] rounded-xl border border-zinc-800 bg-zinc-900/40"
      aria-label={label}
      data-slot="banner"
    >
      {/* Real ad scripts should target [data-slot="banner"]. */}
      <div className="min-h-[90px] w-full" id="cardsnap-ad-slot" />
    </aside>
  );
}
