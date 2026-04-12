import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Terms of Use",
    description:
      "Terms governing use of the CardSnap website, scanner, and related content.",
    alternates: { canonical: `${base}/terms` },
    openGraph: {
      title: "Terms of Use | CardSnap",
      url: `${base}/terms`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <PageAttribution className="mb-6" />

        <h1 className="text-3xl font-bold text-white">Terms of use</h1>
        <p className="mt-3 text-zinc-400">
          These terms apply to your use of CardSnap. The site is provided by
          CardSnap (&quot;we&quot;, &quot;us&quot;). See also our{" "}
          <Link href="/privacy" className="text-amber-400 hover:underline">
            Privacy policy
          </Link>
          .
        </p>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">No professional advice</h2>
          <p>
            CardSnap provides automated estimates and educational content. Nothing on
            the site is investment, tax, or legal advice. Card values and grading
            outcomes vary; you are responsible for your own buying, selling, and
            submission decisions.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Acceptable use</h2>
          <p>You agree not to misuse the service, including by:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Attempting to probe, disrupt, or overload our systems.</li>
            <li>Using the service to violate applicable law or third-party rights.</li>
            <li>Circumventing usage limits or access controls.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Accounts and billing</h2>
          <p>
            Paid features may be offered through a third-party payment processor.
            Fees, renewal, and cancellation are governed by the checkout flow and
            processor terms. We may change pricing with reasonable notice where
            required.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Intellectual property</h2>
          <p>
            The CardSnap name, branding, and site content are protected by applicable
            intellectual property laws. You may not copy or redistribute our content
            for commercial use without permission, except as allowed by law.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Disclaimer of warranties</h2>
          <p>
            The service is provided &quot;as is&quot; without warranties of any kind,
            express or implied, including accuracy, availability, or fitness for a
            particular purpose, to the fullest extent permitted by law.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, CardSnap and its operators will
            not be liable for indirect, incidental, special, consequential, or
            punitive damages, or for any loss of profits or data, arising from your
            use of the site.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Governing law</h2>
          <p>
            These terms are governed by the laws applicable to the operator&apos;s
            jurisdiction, without regard to conflict-of-law rules, except where
            consumer protections require otherwise.
          </p>
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>
            Questions about these terms? Visit{" "}
            <Link href="/contact" className="text-amber-400 hover:underline">
              Contact
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
