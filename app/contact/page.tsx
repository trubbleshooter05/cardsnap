import type { Metadata } from "next";
import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";
import { SeoSiteNav } from "@/components/SeoSiteNav";
import { PageAttribution } from "@/components/PageAttribution";

export async function generateMetadata(): Promise<Metadata> {
  const base = getSiteUrl();
  return {
    title: "Contact",
    description: "How to reach CardSnap about privacy, terms, or product questions.",
    alternates: { canonical: `${base}/contact` },
    openGraph: {
      title: "Contact | CardSnap",
      url: `${base}/contact`,
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SeoSiteNav />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:px-6">
        <PageAttribution className="mb-6" />

        <h1 className="text-3xl font-bold text-white">Contact</h1>
        <p className="mt-3 text-zinc-400">
          For privacy-related requests, billing questions tied to your account, or
          general inquiries about CardSnap, use the options below.
        </p>

        <section className="mt-10 space-y-4 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Email</h2>
          {email ? (
            <p>
              <a
                href={`mailto:${email}`}
                className="font-medium text-amber-400 hover:underline"
              >
                {email}
              </a>
            </p>
          ) : (
            <p className="text-sm text-zinc-500">
              Set <code className="text-zinc-400">NEXT_PUBLIC_CONTACT_EMAIL</code> in
              your deployment environment to display a public contact address.
            </p>
          )}
        </section>

        <section className="mt-10 space-y-3 text-zinc-300">
          <h2 className="text-xl font-semibold text-white">Policies</h2>
          <ul className="list-disc space-y-2 pl-5">
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
              <Link href="/methodology" className="text-amber-400 hover:underline">
                Methodology
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
