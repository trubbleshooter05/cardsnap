import Link from "next/link";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "support@getcardsnap.com";

const FAQS = [
  {
    q: "Where do CardSnap value estimates come from?",
    a: "CardSnap combines recent marketplace-style sold/listing signals, PSA population data when available, and conservative grading-fee assumptions. See our methodology page for full detail.",
  },
  {
    q: "Is this financial or grading advice?",
    a: "No. CardSnap is a research tool for collectors. Markets move quickly — use results as a starting point, not a guarantee of grade or sale price.",
  },
  {
    q: "Can I get a refund?",
    a: "Subscriptions and one-time packs are billed through Stripe. Refund requests are handled per our terms — contact support with your account email.",
  },
  {
    q: "How is my payment handled?",
    a: "Checkout runs on Stripe. CardSnap does not store full card numbers on our servers.",
  },
] as const;

export function HomeTrustSection() {
  return (
    <section className="mt-20 w-full max-w-3xl border-t border-zinc-800 pt-14">
      <h2 className="text-center text-2xl font-bold text-white">
        Trust &amp; transparency
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-center text-sm text-zinc-400">
        Built for collectors deciding whether PSA fees are worth it — with clear
        data sources and policies.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-500">
        <span className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 font-semibold text-zinc-300">
          Payments secured by Stripe
        </span>
        <Link href="/privacy" className="hover:text-zinc-300">
          Privacy policy
        </Link>
        <Link href="/terms" className="hover:text-zinc-300">
          Terms &amp; refunds
        </Link>
        <Link href="/methodology" className="hover:text-zinc-300">
          Data methodology
        </Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="hover:text-zinc-300"
        >
          {SUPPORT_EMAIL}
        </a>
      </div>

      <div className="mt-10 space-y-4">
        <h3 className="text-lg font-semibold text-white">FAQ</h3>
        {FAQS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
          >
            <summary className="cursor-pointer list-none font-medium text-zinc-200 marker:content-none [&::-webkit-details-marker]:hidden">
              {q}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
