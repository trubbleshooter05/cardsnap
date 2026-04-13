import type { ReactNode } from "react";
import Link from "next/link";

function LogoMark() {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="1"
          y="2"
          width="10"
          height="13"
          rx="1.5"
          fill="rgba(0,0,0,0.6)"
        />
        <rect
          x="5"
          y="1"
          width="10"
          height="13"
          rx="1.5"
          fill="rgba(0,0,0,0.85)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="0.5"
        />
        <path
          d="M8 5.5h4M8 7.5h3M8 9.5h4"
          stroke="rgba(251,191,36,0.9)"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

type SiteNavProps = {
  /** Right-side slot (e.g. usage badge on the scanner) */
  trailing?: ReactNode;
  /** Outer padding / max width alignment */
  className?: string;
};

export function SiteNav({ trailing, className = "" }: SiteNavProps) {
  return (
    <header
      className={`relative z-10 flex items-center justify-between gap-4 border-b border-zinc-800/80 bg-zinc-950/40 px-4 py-3 backdrop-blur-sm sm:px-8 ${className}`}
    >
      <Link href="/" className="flex items-center gap-2">
        <LogoMark />
        <span className="text-base font-bold tracking-tight text-white">
          CardSnap
        </span>
      </Link>

      <div className="flex items-center gap-4 sm:gap-6">
        <nav className="flex items-center gap-3 text-sm text-zinc-400 sm:gap-5">
          <Link href="/" className="hover:text-zinc-100 transition-colors">
            Scan
          </Link>
          <Link href="/cards" className="hover:text-zinc-100 transition-colors">
            Card values
          </Link>
          <div className="relative group">
            <button
              type="button"
              className="hover:text-zinc-100 transition-colors"
            >
              Guides
            </button>
            <div className="absolute right-0 z-20 hidden min-w-max rounded-lg border border-zinc-800 bg-zinc-900 py-2 shadow-lg group-hover:block">
              <Link
                href="/guides"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                All grading guides
              </Link>
              <Link
                href="/should-i-grade-zion-williamson-rookie-card"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                Zion rookie — grade or not?
              </Link>
              <Link
                href="/psa-9-vs-psa-10-worth-it"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                PSA 9 vs PSA 10
              </Link>
              <Link
                href="/is-grading-cards-worth-it-2026"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                Is grading worth it (2026)?
              </Link>
              <Link
                href="/methodology"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                Methodology
              </Link>
              <Link
                href="/psa-grading-calculator"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                PSA Grading Calculator
              </Link>
              <Link
                href="/grade-or-skip/baseball"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                Baseball Cards
              </Link>
              <Link
                href="/grade-or-skip/basketball"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                Basketball Cards
              </Link>
              <Link
                href="/grade-or-skip/pokemon"
                className="block px-4 py-2 hover:bg-zinc-800 hover:text-white"
              >
                Pokémon Cards
              </Link>
            </div>
          </div>
        </nav>
        {trailing}
      </div>
    </header>
  );
}
