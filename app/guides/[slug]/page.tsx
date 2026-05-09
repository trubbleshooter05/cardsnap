import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SeoGuidePage } from "@/components/SeoGuidePage";
import {
  buildSeoGuideMetadata,
  getSeoGuideBySlug,
} from "@/lib/seo-guides-data";
import { SEO_GUIDES_IN_DIRECTORY } from "@/lib/seo-guides-data-may-2026";

/** Only `/guides/[slug]` slugs backed by curated long-form guides (programmatic hub). */
const DIRECTORY_SLUGS = new Set(
  SEO_GUIDES_IN_DIRECTORY.map((g) => g.slug)
);

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return SEO_GUIDES_IN_DIRECTORY.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!DIRECTORY_SLUGS.has(params.slug)) {
    return { title: "Not found | CardSnap" };
  }
  const guide = getSeoGuideBySlug(params.slug);
  if (!guide) return { title: "Not found | CardSnap" };
  return buildSeoGuideMetadata(guide);
}

export default function GuidesSlugPage({ params }: Props) {
  if (!DIRECTORY_SLUGS.has(params.slug)) notFound();
  const guide = getSeoGuideBySlug(params.slug);
  if (!guide) notFound();
  return <SeoGuidePage guide={guide} />;
}
