import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { getAllSeoGuides, seoGuidePath } from "@/lib/seo-guides-data";
import { SeoSiteNav } from "@/components/SeoSiteNav";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  const canonical = `${base}/guides`;
  const title = "Card Grading Guides";
  const description =
    "Learn when grading sports cards is worth it, compare PSA 9 vs PSA 10, and check guides for popular players.";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | CardSnap`,
      description,
      url: canonical,
      type: "website",
      siteName: "CardSnap",
    },
  };
}

export default function GuidesIndexPage() {
  const guides = getAllSeoGuides();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />

      <main className="mx-auto max-w-[700px] px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Card grading guides
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          Learn when grading sports cards is worth it, compare PSA 9 vs PSA 10, and
          check guides for popular players.
        </p>

        <ul className="mt-10 space-y-3 border-t border-zinc-800 pt-8">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={seoGuidePath(g.slug)}
                className="block rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-zinc-200 transition hover:border-amber-500/30 hover:bg-zinc-900/80 hover:text-white"
              >
                <span className="font-semibold">{g.h1}</span>
                <span className="mt-1 block text-sm text-zinc-500">{g.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
