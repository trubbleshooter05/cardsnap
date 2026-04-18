import { notFound } from "next/navigation";
import { SeoGuidePage } from "@/components/SeoGuidePage";
import {
  buildSeoGuideMetadata,
  getSeoGuideBySlug,
} from "@/lib/seo-guides-data";
import { SEO_GUIDE_DEFINITIONS_POKEMON } from "@/lib/seo-guides-data-pokemon";

export async function generateStaticParams() {
  return SEO_GUIDE_DEFINITIONS_POKEMON.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const guide = getSeoGuideBySlug(params.slug);
  if (!guide) notFound();
  return buildSeoGuideMetadata(guide);
}

export default function Page({ params }: { params: { slug: string } }) {
  const guide = getSeoGuideBySlug(params.slug);
  if (!guide) notFound();
  return <SeoGuidePage guide={guide} />;
}
