import type { Metadata } from "next";
import { GradeOrSkipPage } from "@/components/GradeOrSkipPage";
import { getSiteUrl } from "@/lib/site-url";
import { getNicheContent } from "@/lib/niche-content";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const content = getNicheContent("baseball");
  return {
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: {
      canonical: `${base}/grade-or-skip/baseball`,
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      type: "article",
      url: `${base}/grade-or-skip/baseball`,
    },
  };
}

export default function BaseballGradeOrSkipPage() {
  return <GradeOrSkipPage category="baseball" />;
}
