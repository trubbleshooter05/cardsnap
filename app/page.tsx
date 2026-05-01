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
      "Sports card grading ROI tool that compares raw value, PSA 9 downside, PSA 10 upside, grading costs, and a simple grade-or-skip verdict before collectors pay PSA fees.",
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
