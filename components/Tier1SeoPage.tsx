import Link from "next/link";
import type { CardPage } from "@/lib/cards";
import { getRelatedCards } from "@/lib/cards";
import { formatUsd, formatUsdSigned } from "@/lib/format-currency";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";
import { JsonLd } from "@/components/JsonLd";
import { AdSlot } from "@/components/AdSlot";
import type { Tier1Template } from "@/lib/tier1-seo";
import {
  buildTier1Faqs,
  estimateAllInGradingCost,
  netVsRawMid,
  rawMid,
  tier1MetaDescription,
  tier1Path,
  tier1Title,
  TIER1_SEO_PAGES,
} from "@/lib/tier1-seo";
import { getSiteUrl } from "@/lib/site-url";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

type Props = {
  card: CardPage;
  template: Tier1Template;
  canonicalPath: string;
};

function faqJsonLd(
  card: CardPage,
  template: Tier1Template,
  pageUrl: string
) {
  const faqs = buildTier1Faqs(card, template);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
    url: pageUrl,
  };
}

function articleJsonLd(card: CardPage, template: Tier1Template, pageUrl: string) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: tier1Title(card, template),
    description: tier1MetaDescription(card, template),
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    author: { "@type": "Organization", name: "CardSnap Research Team" },
    publisher: {
      "@type": "Organization",
      name: "CardSnap",
      "@id": `${base}/#organization`,
      url: base,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
}

function relatedHref(template: Tier1Template, relatedSlug: string): string {
  const hasTier1 = TIER1_SEO_PAGES.some(
    (e) => e.template === template && e.cardSlug === relatedSlug
  );
  if (hasTier1) return tier1Path(template, relatedSlug);
  return `/cards/${relatedSlug}`;
}

export function Tier1SeoPage({ card, template, canonicalPath }: Props) {
  const base = getSiteUrl();
  const pageUrl = `${base}${canonicalPath}`;
  const mid = rawMid(card);
  const costs = estimateAllInGradingCost(card);
  const net9 = netVsRawMid(card, card.psa9Value);
  const net10 = netVsRawMid(card, card.psa10Value);
  const worth = card.gradingVerdict === "worth_grading";
  const related = getRelatedCards(card.slug, 3);
  const faqs = buildTier1Faqs(card, template);

  const breadcrumbSport =
    template === "should_grade"
      ? "Should I grade"
      : template === "psa10_value"
        ? "PSA 10 value"
        : "Raw vs graded";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={articleJsonLd(card, template, pageUrl)} />
      <JsonLd data={faqJsonLd(card, template, pageUrl)} />
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
            <li className="text-zinc-400">{breadcrumbSport}</li>
            <li aria-hidden>/</li>
            <li className="text-zinc-300">{card.playerName}</li>
          </ol>
        </nav>

        <AdSlot />

        <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {tier1Title(card, template)}
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          {tier1MetaDescription(card, template)}
        </p>
        <PageAttribution className="mt-4" />

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Prices &amp; comps</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                  <th className="px-4 py-3 font-semibold text-zinc-300">Tier</th>
                  <th className="px-4 py-3 font-semibold text-zinc-300">Est. value</th>
                  <th className="px-4 py-3 font-semibold text-zinc-300">Notes</th>
                </tr>
              </thead>
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800/80">
                  <td className="px-4 py-3 text-white">Raw (recent comps)</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {formatUsd(card.rawValueLow)} – {formatUsd(card.rawValueHigh)}
                  </td>
                  <td className="px-4 py-3">Mid ~{formatUsd(mid)}</td>
                </tr>
                <tr className="border-b border-zinc-800/80">
                  <td className="px-4 py-3 text-white">PSA 9</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {formatUsd(card.psa9Value)}
                  </td>
                  <td className="px-4 py-3">Mint</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-white">PSA 10</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {formatUsd(card.psa10Value)}
                  </td>
                  <td className="px-4 py-3">Gem</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">PSA population</h2>
          <p className="mt-3 text-zinc-400">
            Estimated PSA graded population (all grades):{" "}
            <span className="font-semibold text-zinc-200">
              {card.popCount.toLocaleString()}
            </span>{" "}
            copies.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Grading cost (illustrative)</h2>
          <p className="mt-3 text-sm text-zinc-500">
            PSA changes fees; planning estimate from raw mid comp (~{formatUsd(mid)}).
          </p>
          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
            <ul className="space-y-2 text-sm text-zinc-300">
              <li className="flex justify-between gap-4">
                <span>Tier</span>
                <span className="text-right text-zinc-400">{costs.tierLabel}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>PSA fee (est.)</span>
                <span>{formatUsd(costs.psaFee)}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>Shipping in/out + supplies (est.)</span>
                <span>{formatUsd(costs.shipping)}</span>
              </li>
              <li className="flex justify-between gap-4 border-t border-zinc-800 pt-3 font-semibold text-white">
                <span>All-in (est.)</span>
                <span>{formatUsd(costs.total)}</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">ROI vs raw mid (model)</h2>
          <p className="mt-3 text-zinc-400">
            Graded resale minus all-in grading minus raw mid (baseline). Negative
            means you need a better buy or a higher grade than the model assumes.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                If PSA 9 result
              </div>
              <div
                className={`mt-2 text-xl font-bold ${
                  net9 >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatUsdSigned(net9)} vs raw mid
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                If PSA 10 result
              </div>
              <div
                className={`mt-2 text-xl font-bold ${
                  net10 >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatUsdSigned(net10)} vs raw mid
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Verdict</h2>
          <div
            className={`mt-4 rounded-xl border p-6 ${
              worth
                ? "border-emerald-500/40 bg-emerald-500/10"
                : "border-rose-500/40 bg-rose-500/10"
            }`}
          >
            <p className="text-lg font-bold text-white">
              {worth
                ? "Yes — grade (if condition is there)"
                : "No — do not grade (most copies)"}
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              {worth
                ? `Net uplift to PSA 9/10 usually clears illustrative fees vs raw mid for ${card.title}. Submit clean copies only.`
                : `Fees and population dilute upside unless you have true gem eye appeal. Prefer selling raw or buying graded.`}
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-white">Scan your card now</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Comps, pop context, and a Grade it / Skip it read on your copy.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-semibold text-black transition-colors hover:from-amber-300 hover:to-orange-400"
          >
            Scan your card now →
          </Link>
        </section>

        <section className="mt-12 border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold text-white">Internal links</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link className="text-amber-400/90 hover:text-amber-300 underline" href="/">
                Home
              </Link>
            </li>
            <li>
              <Link
                className="text-amber-400/90 hover:text-amber-300 underline"
                href="/psa-grading-calculator"
              >
                PSA grading calculator
              </Link>
            </li>
            <li>
              <Link
                className="text-amber-400/90 hover:text-amber-300 underline"
                href={`/cards/${card.slug}`}
              >
                Full card guide: {card.title}
              </Link>
            </li>
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  className="text-zinc-400 hover:text-zinc-200 underline"
                  href={relatedHref(template, r.slug)}
                >
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-white">FAQ</h2>
          <dl className="mt-6 space-y-6">
            {faqs.map((f) => (
              <div key={f.question} className="border-b border-zinc-800 pb-6">
                <dt className="font-semibold text-zinc-200">{f.question}</dt>
                <dd className="mt-2 text-sm text-zinc-400">{f.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-10">
          <AdSlot />
        </div>
      </main>
    </div>
  );
}
