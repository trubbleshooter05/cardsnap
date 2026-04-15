import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { AdSlot } from "@/components/AdSlot";
import { PageAttribution } from "@/components/PageAttribution";
import { JsonLd } from "@/components/JsonLd";
import { CONTENT_LAST_REVIEWED_ISO } from "@/lib/site-constants";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "PSA Grading Calculator — Estimate Card Value & ROI | CardSnap",
    description:
      "Calculate PSA grading ROI instantly. Compare raw vs PSA 9 vs PSA 10 values, estimate grading costs, and decide if your card is worth submitting.",
    alternates: {
      canonical: `${base}/psa-grading-calculator`,
    },
    openGraph: {
      title: "PSA Grading Calculator — Estimate Card Value & ROI",
      description:
        "Calculate PSA grading ROI instantly. Compare raw vs PSA 9 vs PSA 10 values, estimate grading costs, and decide if your card is worth submitting.",
      type: "article",
      url: `${base}/psa-grading-calculator`,
    },
  };
}

interface RoiExample {
  cardName: string;
  rawValue: number;
  psa9Value: number;
  psa10Value: number;
  gradingCost: number;
  psa9Roi: number;
  psa10Roi: number;
  verdict: "strong" | "moderate" | "skip";
}

const roiExamples: RoiExample[] = [
  {
    cardName: "2020 Luka Doncic Prizm Gold",
    rawValue: 150,
    psa9Value: 400,
    psa10Value: 800,
    gradingCost: 50,
    psa9Roi: 200,
    psa10Roi: 600,
    verdict: "strong",
  },
  {
    cardName: "1999 Charizard Holo Base Set",
    rawValue: 500,
    psa9Value: 2200,
    psa10Value: 5000,
    gradingCost: 100,
    psa9Roi: 1600,
    psa10Roi: 4400,
    verdict: "strong",
  },
  {
    cardName: "2021 Mac Jones Rookie Card",
    rawValue: 5,
    psa9Value: 25,
    psa10Value: 50,
    gradingCost: 15,
    psa9Roi: -5,
    psa10Roi: 20,
    verdict: "skip",
  },
];

function RoiCard({
  example,
}: {
  example: RoiExample;
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-white">{example.cardName}</h4>
          <p className="text-sm text-zinc-400 mt-1">
            Grading cost: ${example.gradingCost}
          </p>
        </div>
        <span
          className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
            example.verdict === "strong"
              ? "bg-emerald-500/20 text-emerald-300"
              : example.verdict === "moderate"
                ? "bg-amber-500/20 text-amber-300"
                : "bg-rose-500/20 text-rose-300"
          }`}
        >
          {example.verdict === "strong"
            ? "Grade it"
            : example.verdict === "moderate"
              ? "Consider"
              : "Skip it"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded bg-zinc-800 p-3">
          <p className="text-xs text-zinc-500">Raw</p>
          <p className="mt-1 font-semibold text-white">${example.rawValue}</p>
        </div>
        <div className="rounded bg-zinc-800 p-3">
          <p className="text-xs text-zinc-500">PSA 9</p>
          <p className="mt-1 font-semibold text-white">${example.psa9Value}</p>
          <p className="mt-1 text-xs text-zinc-400">
            ROI: {example.psa9Roi > 0 ? "+" : ""}
            {Math.round((example.psa9Roi / example.rawValue) * 100)}%
          </p>
        </div>
        <div className="rounded bg-zinc-800 p-3">
          <p className="text-xs text-zinc-500">PSA 10</p>
          <p className="mt-1 font-semibold text-white">${example.psa10Value}</p>
          <p className="mt-1 text-xs text-zinc-400">
            ROI: {example.psa10Roi > 0 ? "+" : ""}
            {Math.round((example.psa10Roi / example.rawValue) * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PsaGradingCalculatorPage() {
  const base = getSiteUrl();
  const pageUrl = `${base}/psa-grading-calculator`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "PSA Grading Calculator — Estimate Card Value & ROI",
    description:
      "Calculate PSA grading ROI instantly. Compare raw vs PSA 9 vs PSA 10 values, estimate grading costs, and decide if your card is worth submitting.",
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={articleLd} />
      <SeoSiteNav />

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        {/* Hero H1 */}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          PSA Grading Calculator
        </h1>
        <p className="mt-3 text-lg text-zinc-300">
          Estimate your card&apos;s ROI before you submit. Calculate the difference
          between raw, PSA 9, and PSA 10 values to decide if grading is worth
          it.
        </p>
        <PageAttribution className="mt-4" />

        <div className="mt-8">
          <AdSlot />
        </div>

        {/* What is PSA Grading */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">What is PSA Grading?</h2>
          <p className="mt-3 text-zinc-400">
            PSA (Professional Sports Authenticator) grades sports cards 1–10 based on condition.
            A PSA 9 (&quot;Mint&quot;) typically sells for 3–5× the raw value. A PSA 10 (&quot;Gem Mint&quot;)
            can command 5–15× more—rarity and demand determine the final premium.
          </p>

          <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-300">Why it matters:</span>{" "}
              Collectors and investors buy graded cards because PSA provides
              independent authentication and standardized condition assessment. Graded cards
              sell for measurably higher prices on eBay, Mercari, and specialty platforms.
            </p>
          </div>
        </section>

        {/* PSA Scale Explanation */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">The PSA Grading Scale</h2>
          <div className="mt-4 space-y-3">
            {[
              { grade: "10", label: "Gem Mint", desc: "Nearly perfect. No visible flaws." },
              { grade: "9", label: "Mint", desc: "Slight wear. Almost pristine." },
              { grade: "8", label: "NM-Mint", desc: "Minor wear on corners/edges." },
              { grade: "7", label: "NM", desc: "Light play wear, centered." },
              { grade: "6", label: "EX-Mint", desc: "Obvious wear, still desirable." },
              { grade: "5", label: "EX", desc: "Heavy wear, significant flaws." },
            ].map((item) => (
              <div
                key={item.grade}
                className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4"
              >
                <div className="min-w-16">
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br from-amber-400 to-orange-500">
                    <span className="font-bold text-black">{item.grade}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-zinc-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PSA 9 vs 10 */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">
            PSA 9 vs PSA 10: The Value Gap
          </h2>
          <p className="mt-3 text-zinc-400">
            The difference between a PSA 9 and a PSA 10 is subtle to the eye but
            massive for your wallet. A PSA 10 (&quot;Gem Mint&quot;) commands a premium
            because it&apos;s the highest possible grade—fewer cards achieve it, and
            collectors pay accordingly.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5">
              <h3 className="font-semibold text-emerald-300">PSA 9 (Mint)</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                <li>✓ Nearly pristine appearance</li>
                <li>✓ Imperceptible wear</li>
                <li>✓ Excellent investment value</li>
                <li>✓ 3–8× price multiplier</li>
              </ul>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-5">
              <h3 className="font-semibold text-amber-300">PSA 10 (Gem Mint)</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                <li>✓ Perfect or near-perfect card</li>
                <li>✓ No discernible flaws</li>
                <li>✓ Highest possible grade</li>
                <li>✓ 5–15× price multiplier</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900 p-5">
            <p className="text-sm font-semibold text-zinc-300">Real-world example:</p>
            <p className="mt-2 text-sm text-zinc-400">
              A 1999 Charizard Base Set Holo card graded PSA 9 typically sells for
              $2,200–$2,800. The same card graded PSA 10? $5,000–$7,000+. That&apos;s
              a{" "}
              <span className="font-semibold text-amber-300">
                100%+ premium for one grade point
              </span>
              . But only 2–3% of cards achieve a PSA 10, making it a risky target
              if you&apos;re already borderline.
            </p>
          </div>
        </section>

        {/* ROI Explanation */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">
            Calculate Your Grading ROI
          </h2>
          <p className="mt-3 text-zinc-400">
            ROI = (Graded Value − Grading Cost) − Raw Value. PSA costs $15–$200+ depending on speed and card value.
            If your raw card is worth $10 and grading costs $50, the graded value must exceed $60 to profit.
          </p>

          <div className="mt-6 space-y-4">
            {roiExamples.map((example) => (
              <RoiCard key={example.cardName} example={example} />
            ))}
          </div>
        </section>

        {/* When to Grade */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">When Should You Grade?</h2>

          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-5">
              <h3 className="font-semibold text-emerald-300">✓ Grade Your Card If:</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                <li>
                  • The card&apos;s raw value is $200+ (grading cost becomes a smaller
                  percentage)
                </li>
                <li>
                  • Condition is obviously PSA 9+ (minimal wear, sharp corners)
                </li>
                <li>
                  • It&apos;s a key card or rookie (demand supports the graded premium)
                </li>
                <li>• Net profit after grading is $100+</li>
              </ul>
            </div>

            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-5">
              <h3 className="font-semibold text-rose-300">✗ Skip Grading If:</h3>
              <ul className="mt-2 space-y-1 text-sm text-zinc-300">
                <li>
                  • Raw value is under $50 (grading cost eats the whole margin)
                </li>
                <li>• Visible wear or centering issues (PSA 7–8 range)</li>
                <li>
                  • Break-even ROI is borderline (risks outweigh benefits)
                </li>
                <li>• Common card with low demand</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Hidden Costs */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-white">Hidden Costs to Factor In</h2>
          <ul className="mt-4 space-y-3 text-zinc-400">
            <li>
              <span className="font-semibold text-zinc-300">Grading fees:</span> PSA
              Standard ($15–$50), Express ($75–$150), Fast Track ($100–$200)
            </li>
            <li>
              <span className="font-semibold text-zinc-300">Shipping:</span> $3–$10
              to PSA + $5–$15 return shipping
            </li>
            <li>
              <span className="font-semibold text-zinc-300">Listing fees:</span> eBay
              (12.9%) + PayPal (2.9%) on final sale price
            </li>
            <li>
              <span className="font-semibold text-zinc-300">Slabbing time:</span> PSA
              Standard takes 30–40 days (capital locked up)
            </li>
          </ul>
        </section>

        {/* Tool CTA */}
        <section className="mt-12 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-600/5 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">
            Ready to Scan Your Card?
          </h2>
          <p className="mt-2 text-zinc-300">
            Enter any card name to see instant ROI comps, PSA population data, and
            a clear Grade&nbsp;it / Skip&nbsp;it verdict.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-semibold text-black hover:from-amber-300 hover:to-orange-400 transition-colors"
          >
            Scan Your Card Now →
          </Link>
          <p className="mt-3 text-xs text-zinc-500">
            1 free scan. No signup required.
          </p>
        </section>

        {/* Related Links */}
        <section className="mt-12 border-t border-zinc-800 pt-8">
          <h2 className="text-lg font-semibold text-white">Niche Guides by Sport</h2>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link
              href="/grade-or-skip/baseball"
              className="text-zinc-400 hover:text-zinc-200 underline"
            >
              → Baseball card grading strategy
            </Link>
            <Link
              href="/grade-or-skip/basketball"
              className="text-zinc-400 hover:text-zinc-200 underline"
            >
              → Basketball card grading strategy
            </Link>
            <Link
              href="/grade-or-skip/pokemon"
              className="text-zinc-400 hover:text-zinc-200 underline"
            >
              → Pokémon card grading strategy
            </Link>
            <Link
              href="/cards"
              className="text-zinc-400 hover:text-zinc-200 underline"
            >
              → Browse sports card values &amp; verdicts
            </Link>
          </nav>
        </section>

        <div className="mt-10">
          <AdSlot />
        </div>
      </main>
    </div>
  );
}
