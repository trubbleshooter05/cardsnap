import type { Metadata } from "next";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthProvider } from "@/components/AuthContext";
import { AttributionTracker } from "@/components/AttributionTracker";
import { ConversionTracker } from "@/components/ConversionTracker";
import { GoogleAnalyticsInit } from "@/components/google-analytics-init";
import { GoogleAnalytics } from "@/components/google-analytics";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default:
      "Should I Grade My Card? Sports Card PSA ROI Tool | CardSnap",
    template: "%s | CardSnap",
  },
  description:
    "Should I grade my card? Instant raw vs PSA comps, grading fees modeled, and a clear grade-or-skip verdict — before you ship to PSA.",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "EdP7De48YXoMCUbFmJu9PoxdBlBof-HSUxlZTYVnjiQ",
  },
  openGraph: {
    title: "Should I Grade My Card? Sports Card PSA ROI | CardSnap",
    description:
      "Should I grade my card? Compare raw value, PSA 9/10, fees, and a grade-or-skip verdict in seconds.",
    url: "/",
    siteName: "CardSnap",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CardSnap — sports card grading estimates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Should I Grade My Card? | CardSnap",
    description:
      "Sports card values, PSA comps, fees, and a grading verdict in seconds.",
    images: ["/opengraph-image"],
  },
};

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "CardSnap",
  url: siteUrl,
  description:
    "CardSnap provides sports card value estimates, PSA grading ROI modeling, and educational guides for collectors.",
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/opengraph-image`,
    width: 1200,
    height: 630,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <GoogleAnalyticsInit />
      </head>
      <body className="antialiased bg-[#09090b] text-zinc-100 min-h-screen flex flex-col">
        <GoogleAnalytics />
        <AttributionTracker />
        <ConversionTracker />
        <JsonLd data={organizationLd} />
        <AuthProvider>
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
