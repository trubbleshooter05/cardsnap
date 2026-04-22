import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCardPageBySlug } from "@/lib/cards";
import { getSiteUrl } from "@/lib/site-url";
import { Tier1SeoPage } from "@/components/Tier1SeoPage";
import {
  tier1Entry,
  tier1MetaDescription,
  tier1Path,
  tier1Title,
  TIER1_SEO_PAGES,
} from "@/lib/tier1-seo";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return TIER1_SEO_PAGES.filter((e) => e.template === "psa10_value").map(
    (e) => ({ slug: e.cardSlug })
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = tier1Entry("psa10_value", params.slug);
  if (!entry) return { title: "Not found | CardSnap" };
  const card = getCardPageBySlug(entry.cardSlug);
  if (!card) return { title: "Not found | CardSnap" };
  const path = tier1Path("psa10_value", card.slug);
  const url = `${getSiteUrl()}${path}`;
  const title = `${tier1Title(card, "psa10_value")} | CardSnap`;
  const description = tier1MetaDescription(card, "psa10_value");
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: "CardSnap" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function Psa10ValueTier1Page({ params }: Props) {
  const entry = tier1Entry("psa10_value", params.slug);
  if (!entry) notFound();
  const card = getCardPageBySlug(entry.cardSlug);
  if (!card) notFound();
  const canonicalPath = tier1Path("psa10_value", card.slug);
  return (
    <Tier1SeoPage card={card} template="psa10_value" canonicalPath={canonicalPath} />
  );
}
