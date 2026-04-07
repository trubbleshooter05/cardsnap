import type { Metadata } from "next";
import { GradeOrSkipPage } from "@/components/GradeOrSkipPage";
import { getSiteUrl } from "@/lib/site-url";
import { getNicheContent } from "@/lib/niche-content";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const content = getNicheContent("basketball");
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical: `${base}/grade-or-skip/basketball`,
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      type: "article",
      url: `${base}/grade-or-skip/basketball`,
    },
  };
}

export default function BasketballGradeOrSkipPage() {
  return <GradeOrSkipPage category="basketball" />;
}
