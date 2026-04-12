import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Methodology — How CardSnap Works",
    description:
      "What CardSnap estimates, what inputs it uses, how comps and ROI are modeled, and how often we review content.",
    alternates: {
      canonical: `${base}/methodology`,
    },
    openGraph: {
      title: "Methodology — How CardSnap Works",
      description:
        "Transparency into inputs, data sources, and grading ROI modeling for CardSnap.",
      url: `${base}/methodology`,
      type: "article",
    },
  };
}

export default function MethodologyPage() {
  const base = getSiteUrl();
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "CardSnap methodology",
    description:
      "How the CardSnap scanner models card values, uses third-party data, and produces grade-or-skip style guidance.",
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    author: {
      "@type": "Organization",
      name: "CardSnap Research Team",
    },
    publisher: { "@type": "Organization", name: "CardSnap", url: base },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/methodology` },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={articleLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <PageAttribution className="mb-6" />

        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Methodology
        </h1>
        <p className="mt-3 text-lg text-zinc-300">
          CardSnap helps collectors reason about grading economics using modeled
          values and costs—not a guarantee of auction outcomes or PSA results.
        </p>

        <section className="mt-10 space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">What the tool does</h2>
          <p>
            You enter a card name and a short condition description. CardSnap returns
            estimated raw and PSA-tier resale values, PSA population context when
            available, and a simple recommendation aligned with modeled net return after
            common grading and shipping costs. Outputs are estimates for research
            purposes, not financial advice.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Inputs we use</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-zinc-200">Your text inputs:</span> card name
              (and similar identifying text) plus the condition note you provide.
            </li>
            <li>
              <span className="text-zinc-200">Market listings / sold data:</span>{" "}
              recent public marketplace-style listings and sold results, when
              retrievable for your query, to ground price ranges.
            </li>
            <li>
              <span className="text-zinc-200">PSA population data:</span> when
              available for the identified card, to add context on graded supply.
            </li>
            <li>
              <span className="text-zinc-200">Language model analysis:</span> used
              to interpret your card description and combine signals into structured
              estimates. This can be imperfect on rare, obscure, or misidentified
              cards.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            Recent sales and pricing logic (high level)
          </h2>
          <p>
            When comparable sales or listings are available, we use them to inform
            raw and graded value bands. When data is thin or ambiguous, estimates rely
            more heavily on modeled assumptions and may be wider or less certain.
          </p>
          <p>
            Grading ROI in the scanner uses a net comparison: estimated resale if
            graded (with PSA 9 and PSA 10 paths considered in the underlying model)
            minus estimated raw resale, minus PSA fee tiers that depend on declared
            value, minus a default allowance for shipping and insurance. The
            headline recommendation follows the same net-profit threshold used in the
            product code (currently a minimum expected net gain of about $25 on the
            PSA 10 path versus selling raw, before any optional subscription).
          </p>
          <p className="text-sm text-zinc-500">
            Fees, turnaround times, and market levels change—treat CardSnap as a
            starting point and confirm numbers against current PSA pricing and your
            own comps.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            How often we update content and descriptions
          </h2>
          <p>
            Programmatic card guide pages and the scanner&apos;s methodology copy are
            reviewed on a regular cadence and when product behavior changes. The
            &quot;Updated&quot; date on articles reflects the last editorial pass for
            that page or site section, not real-time market ticks.
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h2 className="text-lg font-semibold text-white">Related</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="text-amber-400 hover:underline">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-amber-400 hover:underline">
                Terms of use
              </Link>
            </li>
            <li>
              <Link href="/" className="text-amber-400 hover:underline">
                Back to scanner
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
