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
    title: "Privacy Policy",
    description:
      "CardSnap privacy policy: what we collect (including anonymous IDs and Stripe payments), how we use data, retention, and your choices.",
    alternates: { canonical: `${base}/privacy` },
    openGraph: {
      title: "Privacy Policy | CardSnap",
      url: `${base}/privacy`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default function PrivacyPage() {
  const base = getSiteUrl();
  const lastUpdated = formatContentUpdatedLong(CONTENT_LAST_REVIEWED_ISO);

  const webPageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy",
    url: `${base}/privacy`,
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
          Privacy Policy
        </h1>
        <p className="mt-4 leading-relaxed text-zinc-400">
          This Privacy Policy describes how CardSnap (&quot;we&quot;, &quot;us&quot;,
          &quot;our&quot;) collects, uses, and shares information when you use{" "}
          <Link href="/" className="text-amber-400 hover:underline">
            {base.replace(/^https?:\/\//, "")}
          </Link>{" "}
          and related services (the &quot;Service&quot;). It applies together with our{" "}
          <Link href="/terms" className="text-amber-400 hover:underline">
            Terms of Service
          </Link>
          .
        </p>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            1. Information we collect
          </h2>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>
              <strong className="text-zinc-200">Identifiers you provide.</strong> When
              you run a scan, we process the card name and condition text you submit.
            </li>
            <li>
              <strong className="text-zinc-200">Anonymous device / browser id.</strong>{" "}
              We store a random identifier (for example in a first-party cookie and
              browser storage) to enforce free-tier limits, associate saved scans with
              your browser, and reduce abuse. This is not the same as logging in with
              email; clearing cookies may reset your identifier.
            </li>
            <li>
              <strong className="text-zinc-200">Analysis and usage records.</strong> We
              store scan outputs and related metadata needed to show results and
              operate the product.
            </li>
            <li>
              <strong className="text-zinc-200">Payment information.</strong> Paid plans
              are processed by{" "}
              <a
                href="https://stripe.com/legal/privacy-center"
                className="text-amber-400 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe
              </a>
              . We do not receive your full card number on our servers; Stripe handles
              payment data under its own terms and privacy policy.
            </li>
            <li>
              <strong className="text-zinc-200">Technical and log data.</strong> Our
              hosting and infrastructure providers may log IP address, user agent,
              timestamps, and similar data for security, reliability, and abuse
              prevention.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            2. How we use information
          </h2>
          <p className="leading-relaxed">We use information to:</p>
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            <li>Provide, maintain, and improve the Service (including AI-assisted estimates).</li>
            <li>Enforce plan limits, process subscriptions, and prevent fraud or abuse.</li>
            <li>Communicate with you when you contact us or when required for the Service.</li>
            <li>Comply with law and respond to lawful requests.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            3. Legal bases (where applicable)
          </h2>
          <p className="leading-relaxed">
            If the GDPR or similar laws apply, we rely on appropriate bases such as
            performance of a contract (providing the Service), legitimate interests
            (security and product improvement), and consent where required (for example
            non-essential cookies or marketing, if we add them and ask).
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            4. Sharing and subprocessors
          </h2>
          <p className="leading-relaxed">
            We share information with service providers who help us run CardSnap
            (including hosting, database, analytics as configured, email, AI APIs, and
            payments). Those parties process data under contractual safeguards and
            their own policies. We do not sell your personal information for money.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">5. Retention</h2>
          <p className="leading-relaxed">
            We retain information for as long as needed to provide the Service, comply
            with law, resolve disputes, and enforce agreements. Retention periods may
            vary by data type; we may delete or anonymize data when no longer needed.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">6. Security</h2>
          <p className="leading-relaxed">
            We use reasonable administrative, technical, and organizational measures
            to protect information. No method of transmission or storage is 100%
            secure.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            7. Your rights and choices
          </h2>
          <p className="leading-relaxed">
            Depending on where you live, you may have rights to access, correct,
            delete, or export personal information, or to object to or restrict certain
            processing. You may also clear cookies to reset anonymous identifiers
            (which may limit continuity of free tier or saved history). To exercise
            rights or ask questions, contact us via{" "}
            <Link href="/contact" className="text-amber-400 hover:underline">
              Contact
            </Link>
            . We may need to verify your request.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            8. International transfers
          </h2>
          <p className="leading-relaxed">
            We may process and store information in the United States and other
            countries where we or our providers operate. By using the Service, you
            understand that your information may be transferred to jurisdictions with
            different data protection rules.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">9. Children</h2>
          <p className="leading-relaxed">
            The Service is not directed at children under 13 (or the minimum age in
            your jurisdiction), and we do not knowingly collect personal information
            from children.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">
            10. Changes to this policy
          </h2>
          <p className="leading-relaxed">
            We may update this Privacy Policy from time to time. We will post the
            updated version on this page and update the &quot;Last updated&quot; date
            when changes are material. Continued use after changes means you accept the
            updated policy, except where applicable law requires additional steps.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">11. Contact</h2>
          <p className="leading-relaxed">
            Questions about this Privacy Policy:{" "}
            <Link href="/contact" className="text-amber-400 hover:underline">
              Contact CardSnap
            </Link>
            .
          </p>
        </section>

        <p className="mt-12 border-t border-zinc-800 pt-8 text-xs text-zinc-500">
          Canonical URL for this policy:{" "}
          <span className="text-zinc-400">{base}/privacy</span>
          {" · "}
          Alternate path (redirects here):{" "}
          <span className="text-zinc-400">{base}/privacy-policy</span>
        </p>
      </main>
    </div>
  );
}
