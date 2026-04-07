import Link from "next/link";

export function SeoSiteNav() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-100 hover:text-white"
        >
          CardSnap
        </Link>
        <nav className="flex gap-4 text-sm text-zinc-400">
          <Link href="/" className="hover:text-zinc-200">
            Scan
          </Link>
          <Link href="/cards" className="hover:text-zinc-200">
            Card values
          </Link>
          <div className="relative group">
            <button className="hover:text-zinc-200">Guides</button>
            <div className="absolute hidden group-hover:block bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg py-2 min-w-max">
              <Link
                href="/psa-grading-calculator"
                className="block px-4 py-2 hover:text-white hover:bg-zinc-800"
              >
                PSA Grading Calculator
              </Link>
              <Link
                href="/grade-or-skip/baseball"
                className="block px-4 py-2 hover:text-white hover:bg-zinc-800"
              >
                Baseball Cards
              </Link>
              <Link
                href="/grade-or-skip/basketball"
                className="block px-4 py-2 hover:text-white hover:bg-zinc-800"
              >
                Basketball Cards
              </Link>
              <Link
                href="/grade-or-skip/pokemon"
                className="block px-4 py-2 hover:text-white hover:bg-zinc-800"
              >
                Pokémon Cards
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
