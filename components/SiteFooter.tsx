import Link from "next/link";
import { getSiteUrl } from "@/lib/site-url";

export function SiteFooter() {
  const base = getSiteUrl();
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950/80">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-zinc-600">
          © {new Date().getUTCFullYear()} CardSnap
        </p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Legal and policies">
          <Link href="/guides" className="hover:text-zinc-300">
            Guides
          </Link>
          <Link href="/methodology" className="hover:text-zinc-300">
            Methodology
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-zinc-300">
            Contact
          </Link>
          <a
            href={`${base}/llms.txt`}
            className="hover:text-zinc-300"
            rel="nofollow"
          >
            llms.txt
          </a>
        </nav>
      </div>
    </footer>
  );
}
