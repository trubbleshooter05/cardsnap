import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CardSnap — Is your card worth grading?",
  description:
    "Sports card value ranges, PSA comps, and a clear grading verdict in seconds.",
  verification: {
    google: "EdP7De48YXoMCUbFmJu9PoxdBlBof-HSUxlZTYVnjiQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
