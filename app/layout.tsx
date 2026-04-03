import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardSnap — Is your card worth grading?",
  description:
    "Instant sports card value comps, PSA grading ROI, and a clear grade-or-skip verdict. Free to try.",
  verification: {
    google: "EdP7De48YXoMCUbFmJu9PoxdBlBof-HSUxlZTYVnjiQ",
  },
  openGraph: {
    title: "CardSnap — Is your card worth grading?",
    description:
      "Instant sports card value comps, PSA grading ROI, and a clear grade-or-skip verdict.",
    siteName: "CardSnap",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CardSnap — Is your card worth grading?",
    description: "Sports card values, PSA comps, and a grading verdict in seconds.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#09090b] text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
