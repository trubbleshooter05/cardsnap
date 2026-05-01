"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/components/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { useEffect, useRef, useState } from "react";
import { notifyAuthModalDismissed, OPEN_AUTH_EVENT } from "@/lib/auth-events";

const GUIDE_LINKS: { href: string; label: string }[] = [
  { href: "/guides", label: "All grading guides" },
  { href: "/pokemon-card-value-checker", label: "Pokemon Card Value Checker" },
  { href: "/pokemon-card-grading-calculator", label: "Pokemon Grading Calculator" },
  { href: "/should-i-grade-zion-williamson-rookie-card", label: "Zion rookie — grade or not?" },
  { href: "/psa-9-vs-psa-10-worth-it", label: "PSA 9 vs PSA 10" },
  { href: "/is-grading-cards-worth-it-2026", label: "Is grading worth it (2026)?" },
  { href: "/methodology", label: "Methodology" },
  { href: "/psa-grading-calculator", label: "PSA Grading Calculator" },
  { href: "/grade-or-skip/baseball", label: "Baseball Cards" },
  { href: "/grade-or-skip/basketball", label: "Basketball Cards" },
  { href: "/grade-or-skip/pokemon", label: "Pokémon Cards" },
];

function LogoMark() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="10" height="13" rx="1.5" fill="rgba(0,0,0,0.6)" />
        <rect x="5" y="1" width="10" height="13" rx="1.5" fill="rgba(0,0,0,0.85)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
        <path d="M8 5.5h4M8 7.5h3M8 9.5h4" stroke="rgba(251,191,36,0.9)" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

type SiteNavProps = {
  trailing?: ReactNode;
  className?: string;
};

export function SiteNav({ trailing, className = "" }: SiteNavProps) {
  const { user, signOut, loading: authLoading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Listen for auth modal events from upgrade flow
  useEffect(() => {
    const openAuth = () => setAuthModalOpen(true);
    window.addEventListener(OPEN_AUTH_EVENT, openAuth);
    return () => window.removeEventListener(OPEN_AUTH_EVENT, openAuth);
  }, []);

  // Close menu on route change (click any link closes it)
  const close = () => setMobileOpen(false);

  const linkCls = "block px-4 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white active:bg-zinc-700";
  const subLinkCls = "block px-6 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white active:bg-zinc-700";

  return (
    <>
      <header
        className={`relative z-40 border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-sm ${className}`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Logo */}
          <Link href="/" onClick={close} className="flex items-center gap-2">
            <LogoMark />
            <span className="text-base font-bold tracking-tight text-white">CardSnap</span>
          </Link>

          {/* Desktop nav — hidden below lg */}
          <nav className="hidden items-center gap-5 text-sm text-zinc-400 lg:flex">
            {user ? (
              <>
                <Link href="/account" className="font-medium text-zinc-300 hover:text-white transition-colors">Account</Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  disabled={authLoading}
                  className="hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
              >
                Sign in
              </button>
            )}
            <Link href="/" className="hover:text-white transition-colors">Analyze</Link>
            <Link href="/sports-card-value-checker" className="hover:text-white transition-colors">Card values</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>

            {/* Desktop Guides dropdown */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-0.5 hover:text-white transition-colors"
              >
                Guides <span className="text-[10px] opacity-60" aria-hidden>▾</span>
              </button>
              <div className="invisible absolute right-0 top-full z-50 pt-1 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                <div className="min-w-[220px] rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 shadow-xl">
                  {GUIDE_LINKS.map((g) => (
                    <Link key={g.href} href={g.href} className="block px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white">
                      {g.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Right side: trailing badge + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            {trailing}

            {/* Hamburger — only on mobile */}
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white lg:hidden"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu — renders inline below the header bar, no fixed/absolute */}
        {mobileOpen && (
          <div ref={mobileMenuRef} className="border-t border-zinc-800 bg-zinc-950 lg:hidden">
            {/* Auth */}
            {user ? (
              <>
                <Link href="/account" className={linkCls} onClick={close}>Account</Link>
                <button
                  type="button"
                  className={`${linkCls} w-full text-left`}
                  onClick={() => { close(); void signOut(); }}
                  disabled={authLoading}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`${linkCls} w-full text-left text-amber-400`}
                onClick={() => { close(); setAuthModalOpen(true); }}
              >
                Sign in
              </button>
            )}

            <div className="my-1 h-px bg-zinc-800" />

            <Link href="/" className={linkCls} onClick={close}>Analyze</Link>
            <Link href="/sports-card-value-checker" className={linkCls} onClick={close}>Card values</Link>
            <Link href="/pricing" className={linkCls} onClick={close}>Pricing</Link>

            <div className="my-1 h-px bg-zinc-800" />

            <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Guides</p>
            {GUIDE_LINKS.map((g) => (
              <Link key={g.href} href={g.href} className={subLinkCls} onClick={close}>
                {g.label}
              </Link>
            ))}

            <div className="my-1 h-px bg-zinc-800" />

            <Link href="/privacy" className={subLinkCls} onClick={close}>Privacy Policy</Link>
            <Link href="/terms" className={subLinkCls} onClick={close}>Terms of Service</Link>
            <Link href="/contact" className={subLinkCls} onClick={close}>Contact</Link>

            <div className="h-4" />
          </div>
        )}
      </header>

      <AuthModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          notifyAuthModalDismissed();
        }}
      />
    </>
  );
}
