import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAcquisitionAsset,
  getAllAcquisitionAssetSlugs,
} from "@/lib/acquisition-assets";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllAcquisitionAssetSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const asset = getAcquisitionAsset(params.slug);
  if (!asset) return {};
  const url = `${getSiteUrl()}/video-scripts/${asset.slug}`;
  return {
    title: asset.metaTitle,
    description: asset.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: asset.metaTitle,
      description: asset.metaDescription,
      url,
      type: "article",
      siteName: "CardSnap",
    },
  };
}

export default function VideoScriptPage({ params }: Props) {
  const asset = getAcquisitionAsset(params.slug);
  if (!asset) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">Short-form acquisition</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{asset.title}</h1>
        <p className="mt-3 text-zinc-400">{asset.description}</p>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
          <h2 className="text-lg font-semibold text-white">Hook</h2>
          <p className="mt-2 text-2xl font-bold text-emerald-300">{asset.hook}</p>
          <p className="mt-2 text-sm text-zinc-500">{asset.cardName}</p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Timeline</h2>
          <ol className="mt-4 divide-y divide-zinc-800 rounded-2xl border border-zinc-800">
            {asset.steps.map((step) => (
              <li key={step.time} className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{step.time}</p>
                <p className="mt-2 text-zinc-200">{step.voiceover}</p>
                <p className="mt-1 text-sm text-zinc-500">Screen: {step.screen}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-semibold text-white">Shot list</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {asset.shotList.map((shot) => (
                <li key={shot}>• {shot}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
            <h2 className="font-semibold text-white">Caption tags</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">{asset.tags.join(" ")}</p>
          </div>
        </section>

        <aside className="mt-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <p className="font-semibold text-white">Turn viewers into scans</p>
          <p className="mt-2 text-sm text-zinc-300">
            Point the end card to the scanner so collectors can check raw value, PSA upside, and grade-or-sell
            verdicts for their own card.
          </p>
          <Link href="/" className="mt-4 inline-flex text-sm font-semibold text-emerald-300 hover:text-emerald-200">
            Open CardSnap scanner →
          </Link>
        </aside>
      </main>
    </div>
  );
}
