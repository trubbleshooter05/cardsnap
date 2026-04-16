import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import {
  CONTENT_LAST_REVIEWED_ISO,
  formatContentUpdatedLong,
} from "@/lib/site-constants";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";
import { JsonLd } from "@/components/JsonLd";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Terms of Service",
    description:
      "CardSnap terms of service: acceptable use, subscriptions and Stripe billing, disclaimers, limitation of liability, and contact.",
    alternates: { canonical: `${base}/terms` },
    openGraph: {
      title: "Terms of Service | CardSnap",
      url: `${base}/terms`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default function TermsPage() {
  const base = getSiteUrl();
  const lastUpdated = formatContentUpdatedLong(CONTENT_LAST_REVIEWED_ISO);

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms of Service",
    url: `${base}/terms`,
    dateModified: CONTENT_LAST_REVIEWED_ISO,
    isPartOf: { "@type": "WebSite", name: "CardSnap", url: base },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={webPageLd} />
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <PageAttribution className="mb-6" />

        <p className="text-sm text-zinc-500">Last updated: {lastUpdated}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-4 leading-relaxed text-zinc-400">
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of
          CardSnap&apos;s website and tools at{" "}
          <Link href="/" className="text-amber-400 hover:underline">
            {base.replace(/^https?:\/\//, "")}
          </Link>{" "}
          (the &quot;Service&quot;). By using the Service, you agree to these Terms and
          our{" "}
          <Link href="/privacy" className="text-amber-400 hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">1. The Service</h2>
          <p className="leading-relaxed">
            CardSnap provides automated estimates, comparisons, and educational content
            related to sports card grading decisions. Features and availability may
            change. We may suspend or discontinue parts of the Service with or without
            notice where reasonable.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            2. Not professional advice
          </h2>
          <p className="leading-relaxed">
            The Service is for general information only. Nothing on CardSnap is
            investment, financial, tax, or legal advice. Card values, grading outcomes,
            and fees change; models and third-party data may be incomplete or
            inaccurate. You are solely responsible for your buying, selling, grading,
            and submission decisions.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            3. Eligibility and accounts
          </h2>
          <p className="leading-relaxed">
            You must be able to form a binding contract in your jurisdiction to use the
            Service. The Service may use browser storage and cookies to identify your
            device for limits and saved activity. You are responsible for maintaining
            access to that browser profile if you rely on paid features tied to it.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">4. Acceptable use</h2>
          <p className="leading-relaxed">You agree not to:</p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>Probe, disrupt, overload, or circumvent security or usage limits.</li>
            <li>Use the Service to violate applicable law or third-party rights.</li>
            <li>Scrape, resell, or commercially exploit the Service without permission.</li>
            <li>Upload unlawful, harmful, or infringing content.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            5. Subscriptions, fees, and billing
          </h2>
          <p className="leading-relaxed">
            Paid plans may be offered through{" "}
            <a
              href="https://stripe.com"
              className="text-amber-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stripe
            </a>
            . Prices, taxes, renewal, cancellation, and refunds are presented at
            checkout and governed by Stripe&apos;s flows and applicable law. We may
            change pricing for new purchases with notice where required. Failure to pay
            may result in loss of paid features.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            6. Intellectual property
          </h2>
          <p className="leading-relaxed">
            The CardSnap name, branding, software, and site content are owned by
            CardSnap or its licensors. Except for the limited right to use the Service
            as offered, you receive no ownership rights. Do not copy, modify, or
            redistribute our materials for commercial purposes without permission,
            except as allowed by law.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            7. Third-party services
          </h2>
          <p className="leading-relaxed">
            The Service may rely on third-party data and APIs (for example market
            listings or population data). Those providers are not responsible for
            CardSnap, and their terms may apply to their data.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            8. Disclaimer of warranties
          </h2>
          <p className="leading-relaxed">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;
            WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
            NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            9. Limitation of liability
          </h2>
          <p className="leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, CARDSNAP AND ITS AFFILIATES,
            OFFICERS, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA,
            OR GOODWILL, ARISING FROM OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF
            ADVISED OF THE POSSIBILITY. OUR AGGREGATE LIABILITY FOR CLAIMS RELATING TO
            THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR
            THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED
            U.S. DOLLARS (US$100), EXCEPT WHERE PROHIBITED BY LAW.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">10. Indemnity</h2>
          <p className="leading-relaxed">
            You will defend and indemnify CardSnap against claims, damages, losses, and
            expenses (including reasonable attorneys&apos; fees) arising from your use
            of the Service, your content, or your violation of these Terms, to the
            extent permitted by law.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">11. Governing law</h2>
          <p className="leading-relaxed">
            These Terms are governed by the laws of the State of Delaware, United
            States, excluding conflict-of-law rules, subject to mandatory consumer
            protections in your place of residence where applicable. Courts in
            Delaware (or another forum we designate in writing) have exclusive
            jurisdiction, except where prohibited.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">12. Changes</h2>
          <p className="leading-relaxed">
            We may modify these Terms by posting updates on this page and changing the
            &quot;Last updated&quot; date. If a change is material, we will take
            reasonable steps to notify you where required by law. Continued use after
            changes become effective constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">13. Contact</h2>
          <p className="leading-relaxed">
            Questions about these Terms:{" "}
            <Link href="/contact" className="text-amber-400 hover:underline">
              Contact CardSnap
            </Link>
            .
          </p>
        </section>

        <p className="mt-12 border-t border-zinc-800 pt-8 text-xs text-zinc-500">
          Canonical URL for these terms:{" "}
          <span className="text-zinc-400">{base}/terms</span>
          {" · "}
          Alternate path (redirects here):{" "}
          <span className="text-zinc-400">{base}/terms-of-service</span>
        </p>
      </main>
    </div>
  );
}
