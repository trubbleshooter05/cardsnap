import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllCardSlugs,
  getCardPageBySlug,
  getRelatedCards,
  type CardPage,
} from "@/lib/cards";
import { getSiteUrl } from "@/lib/site-url";
import { formatUsd } from "@/lib/format-currency";
import { AdSlot } from "@/components/AdSlot";
import { SeoSiteNav } from "@/components/SeoSiteNav";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllCardSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = getCardPageBySlug(params.slug);
  if (!card) {
    return { title: "Card not found | CardSnap" };
  }
  const url = `${getSiteUrl()}/cards/${card.slug}`;
  return {
    title: card.metaTitle,
    description: card.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: card.metaTitle,
      description: card.metaDescription,
      url,
      siteName: "CardSnap",
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: card.metaTitle,
      description: card.metaDescription,
    },
  };
}

function jsonLdArticle(card: CardPage) {
  const base = getSiteUrl();
  const url = `${base}/cards/${card.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: card.title,
    description: card.metaDescription,
    datePublished: card.createdAt,
    dateModified: card.updatedAt,
    author: { "@type": "Organization", name: "CardSnap" },
    publisher: { "@type": "Organization", name: "CardSnap" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

export default function CardSeoPage({ params }: Props) {
  const card = getCardPageBySlug(params.slug);
  if (!card) notFound();

  const related = getRelatedCards(card.slug, 6);
  const verdictWorth = card.gradingVerdict === "worth_grading";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdArticle(card)),
        }}
      />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-zinc-300">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/cards" className="hover:text-zinc-300">
                Cards
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-zinc-300">{card.playerName}</li>
          </ol>
        </nav>

        <AdSlot />

        <h1 className="mt-8 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {card.playerName} {card.year} {card.brand} #{card.cardNumber} — Value,
          Prices &amp; Grading Guide
        </h1>
        <p className="mt-3 text-zinc-400">{card.metaDescription}</p>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <h2 className="sr-only">Value summary</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Raw value
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {formatUsd(card.rawValueLow)} – {formatUsd(card.rawValueHigh)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                PSA 9 / PSA 10
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {formatUsd(card.psa9Value)} / {formatUsd(card.psa10Value)}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Pop (est.)
              </div>
              <div className="mt-1 text-lg font-semibold text-white">
                {card.popCount.toLocaleString()} graded
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Grading verdict
              </div>
              <div
                className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${
                  verdictWorth
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {verdictWorth ? "WORTH GRADING" : "SKIP GRADING"}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8">
          <AdSlot label="Sponsored" />
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white">Full guide</h2>
          {card.content.trim() ? (
            <div
              className="prose-card mt-4 space-y-4 text-zinc-300 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_li]:my-1 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: card.content }}
            />
          ) : (
            <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-sm text-zinc-500">
              In-depth article coming soon. Run{" "}
              <code className="text-zinc-400">npx tsx scripts/generate-card-content.ts</code>{" "}
              locally to generate HTML content.
            </p>
          )}
        </section>

        <aside className="mt-10 rounded-2xl border border-zinc-700 bg-zinc-900 p-5 sm:p-6">
          <p className="text-base font-semibold text-white">
            Have this card? Get a personalized verdict
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Scan yours with our tool — instant comps, PSA context, and a clear
            grade-or-skip recommendation.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200"
          >
            Scan your card →
          </Link>
        </aside>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">Related cards</h2>
          <ul className="mt-4 space-y-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/cards/${r.slug}`}
                  className="text-zinc-300 underline-offset-4 hover:text-white hover:underline"
                >
                  {r.title}
                </Link>
                <span className="ml-2 text-sm text-zinc-500">
                  PSA 10 {formatUsd(r.psa10Value)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <AdSlot />
        </div>
      </main>
    </div>
  );
}
