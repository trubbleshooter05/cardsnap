import {
  buildEbaySoldSearchAffiliateUrl,
  EBAY_AFFILIATE_DISCLOSURE,
  isEbayAffiliateEnabled,
} from "@/lib/ebay-affiliate";

type Props = {
  query: string;
  customId?: string;
  className?: string;
};

export function EbayAffiliateButton({ query, customId, className = "" }: Props) {
  if (!isEbayAffiliateEnabled()) return null;
  const href = buildEbaySoldSearchAffiliateUrl(query, {
    customId: customId ?? "getcardsnap-scan",
    soldOnly: true,
  });
  if (!href) return null;

  return (
    <div className={className}>
      <a
        href={href}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20"
      >
        Check sold listings on eBay
      </a>
      <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
        {EBAY_AFFILIATE_DISCLOSURE}
      </p>
    </div>
  );
}
