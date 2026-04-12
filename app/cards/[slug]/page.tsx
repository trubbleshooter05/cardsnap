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
import { PageAttribution } from "@/components/PageAttribution";

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
    author: { "@type": "Organization", name: "CardSnap Research Team" },
    publisher: {
      "@type": "Organization",
      name: "CardSnap",
      "@id": `${base}/#organization`,
      url: base,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

function jsonLdFaq(card: CardPage) {
  const name = `${card.playerName} ${card.year} ${card.brand} #${card.cardNumber}`;
  const verdictText =
    card.gradingVerdict === "worth_grading"
      ? `Yes. The ${name} is generally worth grading. A PSA 10 copy is estimated at $${card.psa10Value}, compared to a raw value of $${card.rawValueLow}–$${card.rawValueHigh}. After PSA grading fees and shipping, the net return is typically positive.`
      : `No. The ${name} is usually not worth grading. A raw copy sells for $${card.rawValueLow}–$${card.rawValueHigh} and a PSA 10 fetches around $${card.psa10Value}, which often doesn't justify the PSA grading fee and shipping costs.`;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How much is a ${name} worth?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A raw ${name} in typical condition is worth approximately $${card.rawValueLow} to $${card.rawValueHigh}. A PSA 9 graded copy is worth around $${card.psa9Value} and a PSA 10 is worth approximately $${card.psa10Value}.`,
        },
      },
      {
        "@type": "Question",
        name: `Is the ${name} worth grading?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: verdictText,
        },
      },
      {
        "@type": "Question",
        name: `What is the PSA 10 value of the ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A PSA 10 graded ${name} is estimated to be worth approximately $${card.psa10Value} based on recent comparable sales. PSA 9 copies sell for around $${card.psa9Value}.`,
        },
      },
      {
        "@type": "Question",
        name: `How many ${name} cards have been graded by PSA?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Approximately ${card.popCount.toLocaleString()} copies of the ${name} have been submitted and graded by PSA. A higher population generally means more competition in the market and can affect the premium a graded copy commands.`,
        },
      },
      {
        "@type": "Question",
        name: `What is the difference between a raw and graded ${name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `A "raw" ${name} is ungraded and sells for around $${card.rawValueLow}–$${card.rawValueHigh}. A graded copy has been authenticated and assigned a grade (1–10) by PSA. A PSA 10 (Gem Mint) ${name} commands a significant premium at approximately $${card.psa10Value}, reflecting the card's verified condition and collector confidence.`,
        },
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdFaq(card)),
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
        <PageAttribution className="mt-4" updatedIso={card.updatedAt} />

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

        {/* FAQ section — visible on page AND in structured data */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white">
            Frequently asked questions
          </h2>
          <div className="mt-4 space-y-4">
            {[
              {
                q: `How much is a ${card.playerName} ${card.year} ${card.brand} #${card.cardNumber} worth?`,
                a: `A raw copy in typical condition is worth approximately ${formatUsd(card.rawValueLow)}–${formatUsd(card.rawValueHigh)}. A PSA 9 graded copy is worth around ${formatUsd(card.psa9Value)} and a PSA 10 is worth approximately ${formatUsd(card.psa10Value)}.`,
              },
              {
                q: `Is the ${card.playerName} ${card.year} ${card.brand} #${card.cardNumber} worth grading?`,
                a:
                  card.gradingVerdict === "worth_grading"
                    ? `Yes — in most cases. A PSA 10 commands a strong premium over the raw value, and after grading fees and shipping the net return is typically positive. Use CardSnap to get a personalized ROI calculation for your specific copy.`
                    : `Generally no. The premium between raw and graded isn't large enough to offset PSA grading fees and shipping in most scenarios. Use CardSnap to run the exact numbers for your copy.`,
              },
              {
                q: `How many ${card.playerName} ${card.year} ${card.brand} #${card.cardNumber} cards have been graded by PSA?`,
                a: `Approximately ${card.popCount.toLocaleString()} copies have been graded by PSA. A higher population means more supply in the graded market, which tends to compress the premium over raw.`,
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4"
              >
                <summary className="cursor-pointer list-none text-sm font-medium text-zinc-200 marker:content-none group-open:text-white">
                  <span className="mr-2 text-amber-400 group-open:hidden">+</span>
                  <span className="mr-2 hidden text-amber-400 group-open:inline">−</span>
                  {q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{a}</p>
              </details>
            ))}
          </div>
        </section>

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
