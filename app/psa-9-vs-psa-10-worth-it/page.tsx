import { notFound } from "next/navigation";
import { SeoGuidePage } from "@/components/SeoGuidePage";
import {
  buildSeoGuideMetadata,
  getSeoGuideBySlug,
} from "@/lib/seo-guides-data";

const SLUG = "psa-9-vs-psa-10-worth-it" as const;

export async function generateMetadata() {
  const guide = getSeoGuideBySlug(SLUG);
  if (!guide) notFound();
  return buildSeoGuideMetadata(guide);
}

export default function Page() {
  const guide = getSeoGuideBySlug(SLUG);
  if (!guide) notFound();
  return <SeoGuidePage guide={guide} />;
}
