import { HomePageClient } from "@/components/HomePageClient";
import { JsonLd } from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

export default function HomePage() {
  const base = getSiteUrl();

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CardSnap",
    applicationCategory: "https://schema.org/WebApplication",
    operatingSystem: "Web",
    url: `${base}/`,
    description:
      "Sports card grading decision tool: estimated raw and PSA-graded values, PSA population context, and a grade-or-skip style recommendation based on modeled net return after fees.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        "Three free analyses for new visitors; optional paid plan for unlimited usage.",
    },
    provider: {
      "@type": "Organization",
      name: "CardSnap",
      url: base,
    },
    dateModified: CONTENT_LAST_REVIEWED_ISO,
  };

  return (
    <>
      <JsonLd data={softwareApp} />
      <HomePageClient />
    </>
  );
}
