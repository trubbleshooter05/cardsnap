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
  return TIER1_SEO_PAGES.filter((e) => e.template === "raw_vs_graded").map(
    (e) => ({ slug: e.cardSlug })
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = tier1Entry("raw_vs_graded", params.slug);
  if (!entry) return { title: "Not found | CardSnap" };
  const card = getCardPageBySlug(entry.cardSlug);
  if (!card) return { title: "Not found | CardSnap" };
  const path = tier1Path("raw_vs_graded", card.slug);
  const url = `${getSiteUrl()}${path}`;
  const title = `${tier1Title(card, "raw_vs_graded")} | CardSnap`;
  const description = tier1MetaDescription(card, "raw_vs_graded");
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article", siteName: "CardSnap" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function RawVsGradedTier1Page({ params }: Props) {
  const entry = tier1Entry("raw_vs_graded", params.slug);
  if (!entry) notFound();
  const card = getCardPageBySlug(entry.cardSlug);
  if (!card) notFound();
  const canonicalPath = tier1Path("raw_vs_graded", card.slug);
  return (
    <Tier1SeoPage card={card} template="raw_vs_graded" canonicalPath={canonicalPath} />
  );
}
