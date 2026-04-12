import type { Metadata } from "next";
import "./globals.css";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CardSnap — Is your card worth grading?",
    template: "%s | CardSnap",
  },
  description:
    "Instant sports card value comps, PSA grading ROI, and a clear grade-or-skip verdict. Free to try — no account required.",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "EdP7De48YXoMCUbFmJu9PoxdBlBof-HSUxlZTYVnjiQ",
  },
  openGraph: {
    title: "CardSnap — Is your card worth grading?",
    description:
      "Instant sports card value comps, PSA grading ROI, and a clear grade-or-skip verdict.",
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
    title: "CardSnap — Is your card worth grading?",
    description: "Sports card values, PSA comps, and a grading verdict in seconds.",
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
      <body className="antialiased bg-[#09090b] text-zinc-100 min-h-screen flex flex-col">
        <JsonLd data={organizationLd} />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
