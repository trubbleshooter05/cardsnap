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
      "Answers 'should I grade my card' with a sports card grading ROI model: raw value, PSA 9 downside, PSA 10 upside, fees, and a grade-or-skip verdict before you pay PSA.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        "Five free scans for new visitors; optional paid plans for more scans or unlimited usage.",
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
