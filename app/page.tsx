"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { ResultCard } from "@/components/ResultCard";
import { ScanGate } from "@/components/ScanGate";
import { getOrCreateAnonymousId } from "@/lib/anonymous-id";
import type { ScanResultPayload } from "@/lib/types";

type ScanResponse = ScanResultPayload & {
  scanId: string;
  scansUsedThisMonth: number;
  freeScanLimit: number;
  isPro: boolean;
};

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const id = getOrCreateAnonymousId();
    setUserId(id);
  }, []);

  const refreshUsage = useCallback(async (uid: string) => {
    const res = await fetch(`/api/usage?userId=${encodeURIComponent(uid)}`);
    if (!res.ok) return;
    const data = (await res.json()) as {
      count: number;
      isPro: boolean;
      limit: number;
    };
    setUsageCount(data.count);
    setIsPro(data.isPro);
  }, []);

  useEffect(() => {
    if (!userId) return;
    void refreshUsage(userId);
  }, [userId, refreshUsage]);

  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      void refreshUsage(userId);
      window.history.replaceState({}, "", "/");
    }
  }, [userId, refreshUsage]);

  const handleSubmit = async (payload: {
    cardName: string;
    condition: string;
  }) => {
    if (!userId) return;
    if (!isPro && usageCount >= 5) {
      setGateOpen(true);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: payload.cardName,
          condition: payload.condition,
          userId,
        }),
      });

      if (res.status === 402) {
        setGateOpen(true);
        return;
      }

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string;
          hint?: string;
        };
        console.error(err);
        const code = err.error ?? `http_${res.status}`;
        const extra = err.hint ? `\n\n${err.hint}` : "";
        alert(`Something went wrong (${code}). Try again.${extra}`);
        return;
      }

      const data = (await res.json()) as ScanResponse;
      setResult(data);
      setUsageCount(data.scansUsedThisMonth);
      setIsPro(data.isPro);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!userId) return;
    setUpgrading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        alert("Checkout unavailable. Check Stripe configuration.");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } finally {
      setUpgrading(false);
    }
  };

  const limit = 5;
  const scansLeft = Math.max(0, limit - usageCount);

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-amber-500/8 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-[400px] w-[400px] rounded-full bg-orange-600/5 blur-[100px]" />
        <div className="absolute bottom-0 -left-32 h-[300px] w-[300px] rounded-full bg-amber-400/4 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-8">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
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
          <span className="text-base font-bold tracking-tight text-white">
            CardSnap
          </span>
        </div>

        <nav className="flex items-center gap-4 sm:gap-6">
          <Link
            href="/cards"
            className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Card values
          </Link>
          {userId && (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                isPro
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {isPro ? "⚡ Pro" : `${scansLeft} free left`}
            </span>
          )}
        </nav>
      </header>

      <main className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-4 pb-20 pt-10 sm:pt-16">
        {/* Hero */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Sports Card Grading Tool
        </div>

        <h1 className="mt-3 text-center text-4xl font-black tracking-tight text-white sm:text-5xl leading-[1.1]">
          Is your card{" "}
          <span className="gradient-text">worth grading?</span>
        </h1>

        <p className="mt-4 max-w-sm text-center text-base text-zinc-400 leading-relaxed">
          Get instant raw &amp; graded values, PSA population data, and a clear
          Grade&nbsp;it / Skip&nbsp;it verdict.
        </p>

        {/* Trust pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            "5 free scans",
            "No signup needed",
            "Results in seconds",
          ].map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/60 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400"
            >
              <span className="text-emerald-400">✓</span> {t}
            </span>
          ))}
        </div>

        {/* Form card */}
        <div className="mt-10 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
          <ScanForm disabled={loading} onSubmit={handleSubmit} />

          {/* Scan counter — visible inline so mobile users see it update */}
          {userId && !isPro && (
            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i < usageCount ? "bg-amber-400" : "bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">
                {usageCount} of 5 free scans used
              </span>
            </div>
          )}
          {isPro && (
            <div className="mt-4 border-t border-zinc-800 pt-3 text-center text-xs text-amber-400 font-medium">
              ⚡ Pro — unlimited scans
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div
            className="mt-10 flex flex-col items-center gap-4"
            aria-live="polite"
          >
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-zinc-800 border-t-amber-400" />
              <div className="absolute inset-0 rounded-full blur-md bg-amber-400/20 animate-pulse" />
            </div>
            <span className="text-sm text-zinc-400 animate-pulse">
              Analyzing your card…
            </span>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="mt-10 w-full flex justify-center">
            <ResultCard
              data={result}
              scanId={result.scanId}
              onNewScan={() => {
                setResult(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        )}

        {/* Bottom feature strip — only when no result */}
        {!result && !loading && (
          <div className="mt-16 grid grid-cols-3 gap-3 w-full">
            {[
              {
                icon: "💰",
                title: "Raw & Graded Values",
                desc: "PSA 9 and PSA 10 comps from recent sales",
              },
              {
                icon: "📊",
                title: "PSA Population",
                desc: "See how rare your card is in top grades",
              },
              {
                icon: "⚡",
                title: "Instant ROI",
                desc: "Know your net profit before you submit",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center"
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="text-xs font-semibold text-zinc-200 leading-tight">
                  {f.title}
                </p>
                <p className="text-[11px] text-zinc-500 leading-snug">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      <ScanGate
        open={gateOpen}
        onClose={() => setGateOpen(false)}
        onUpgrade={handleUpgrade}
        upgrading={upgrading}
      />
    </div>
  );
}
