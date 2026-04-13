import { notFound } from "next/navigation";
import { SeoGuidePage } from "@/components/SeoGuidePage";
import {
  buildSeoGuideMetadata,
  getSeoGuideBySlug,
} from "@/lib/seo-guides-data";

const SLUG = "should-i-grade-ja-morant-rookie-card" as const;

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
