import type { Metadata } from "next";
import { PricingPageClient } from "@/components/PricingPageClient";
import { getSiteUrl } from "@/lib/site-url";

const base = getSiteUrl();

export const metadata: Metadata = {
  title: "CardSnap Pricing — Pro Grading Decisions",
  description:
    "CardSnap pricing: 5 free card scans, prepaid scan packs, or unlimited grading decisions with monthly or annual Pro.",
  alternates: { canonical: `${base}/pricing` },
  openGraph: {
    title: "CardSnap Pricing — Pro Grading Decisions",
    description:
      "Start with 5 free scans, then choose scan packs or unlimited Pro (monthly or annual).",
    url: `${base}/pricing`,
    siteName: "CardSnap",
    type: "website",
  },
};

export default function PricingPage() {
  return <PricingPageClient />;
}
