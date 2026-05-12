import { notFound } from "next/navigation";
import { SeoGuidePage } from "@/components/SeoGuidePage";
import {
  buildSeoGuideMetadata,
  getSeoGuideBySlug,
} from "@/lib/seo-guides-data";

const SLUG = "is-2024-panini-prizm-bo-nix-rookie-worth-grading-2026" as const;

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
