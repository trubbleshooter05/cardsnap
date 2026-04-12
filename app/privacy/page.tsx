import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Privacy Policy",
    description:
      "How CardSnap collects, uses, and stores information when you use the scanner and website.",
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
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <PageAttribution className="mb-6" />

        <h1 className="text-3xl font-bold text-white">Privacy policy</h1>
        <p className="mt-3 text-zinc-400">
          This policy describes how CardSnap (&quot;we&quot;, &quot;us&quot;) handles
          information when you use our website and tools. By using the site, you
          agree to this policy alongside our{" "}
          <Link href="/terms" className="text-amber-400 hover:underline">
            Terms of use
          </Link>
          .
        </p>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-zinc-200">Usage and device data:</strong> basic
              technical data typical of web apps (for example IP address, browser type,
              and timestamps) via hosting and analytics providers as configured.
            </li>
            <li>
              <strong className="text-zinc-200">Scanner inputs:</strong> the card name
              and condition text you submit to generate a result.
            </li>
            <li>
              <strong className="text-zinc-200">Identifiers:</strong> an anonymous
              identifier stored in a cookie or similar storage to enforce free-tier
              limits and associate scans with your browser session.
            </li>
            <li>
              <strong className="text-zinc-200">Payment data:</strong> if you
              subscribe through Stripe, payment details are processed by Stripe under
              their terms; we do not receive full card numbers on our servers.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">How we use information</h2>
          <p>To operate and improve CardSnap, including:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Generating scan results and saving them when you use the product.</li>
            <li>Enforcing plan limits and preventing abuse.</li>
            <li>Securing the service and diagnosing errors.</li>
            <li>Complying with law and responding to valid legal requests.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Retention</h2>
          <p>
            We retain scan records and related data as needed to provide the service
            and for a limited period for security and operations. Exact retention may
            evolve; we will keep this policy updated for material changes.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Third parties</h2>
          <p>
            We use infrastructure and service providers (for example hosting, database,
            email, payments, and AI APIs) to run CardSnap. Those providers process data
            under their own terms and privacy policies.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Your choices</h2>
          <p>
            You can clear site cookies in your browser, which may reset anonymous
            identifiers. For privacy-related requests, use the contact options on our{" "}
            <Link href="/contact" className="text-amber-400 hover:underline">
              Contact
            </Link>{" "}
            page.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Children</h2>
          <p>
            CardSnap is not directed at children under 13, and we do not knowingly
            collect personal information from children.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Changes</h2>
          <p>
            We may update this policy from time to time. Continued use after changes
            means you accept the updated policy.
          </p>
        </section>
      </main>
    </div>
  );
}
