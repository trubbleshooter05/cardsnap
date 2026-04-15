"use client";

import { useCallback, useEffect, useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { ResultCard } from "@/components/ResultCard";
import { ScanGate } from "@/components/ScanGate";
import { SiteNav } from "@/components/SiteNav";
import { PageAttribution } from "@/components/PageAttribution";
import { getOrCreateAnonymousId, persistAnonymousId } from "@/lib/anonymous-id";
import type { ScanResultPayload } from "@/lib/types";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

type ScanResponse = ScanResultPayload & {
  scanId: string;
  scansUsedThisMonth: number;
  freeScansUsed?: number;
  freeScanLimit: number;
  isPro: boolean;
};

export function HomePageClient() {
  const [userId, setUserId] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [freeLimit, setFreeLimit] = useState(FREE_SCAN_LIMIT);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    const id = getOrCreateAnonymousId();
    setUserId(id);
    persistAnonymousId(id);
  }, []);

  const refreshUsage = useCallback(async (uid: string) => {
    const res = await fetch(`/api/usage?userId=${encodeURIComponent(uid)}`, {
      cache: "no-store",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      count: number;
      isPro: boolean;
      limit: number;
    };
    setUsageCount(data.count);
    setFreeLimit(data.limit);
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
    if (!isPro && usageCount >= freeLimit) {
      setGateOpen(true);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        cache: "no-store",
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
      const used = data.freeScansUsed ?? data.scansUsedThisMonth;
      const lim = data.freeScanLimit ?? FREE_SCAN_LIMIT;
      setUsageCount(used);
      setFreeLimit(lim);
      setIsPro(data.isPro);
      persistAnonymousId(userId);
      if (!data.isPro && used >= lim) {
        setGateOpen(true);
      }
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

  const scansLeft = Math.max(0, freeLimit - usageCount);

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

      <SiteNav
        trailing={
          userId ? (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
                isPro
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {isPro ? "⚡ Pro" : `${scansLeft} free left`}
            </span>
          ) : null
        }
      />

      <main className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-4 pb-20 pt-10 sm:pt-16">
        <PageAttribution className="mb-6 w-full text-center" />

        {/* Hero */}
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          Sports Card Grading Tool
        </div>

        <h1 className="mt-3 text-center text-4xl font-black tracking-tight text-white sm:text-5xl leading-[1.1]">
          Should you grade{" "}
          <span className="gradient-text">this card?</span>
        </h1>

        <p className="mt-4 max-w-md text-center text-base text-zinc-300 leading-relaxed">
          Upload a card and instantly see whether grading looks worth it based on
          raw vs graded value upside.
        </p>

        <p className="mt-3 max-w-md text-center text-sm text-zinc-500 leading-relaxed">
          Use 1 free scan. Then upgrade for unlimited grading checks.
        </p>

        <ul className="mt-6 w-full max-w-md space-y-2.5 text-left text-sm text-zinc-300">
          {[
            "Spot cards worth grading faster",
            "Avoid wasting money on bad submissions",
            "Compare upside before you send to PSA",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-amber-400" aria-hidden>
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/* Form card */}
        <div className="mt-10 w-full rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
          <ScanForm disabled={loading} onSubmit={handleSubmit} />

          {/* Scan counter — visible inline so mobile users see it update */}
          {userId && !isPro && (
            <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
              <div className="flex gap-1">
                {Array.from({ length: freeLimit }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-6 rounded-full transition-colors ${
                      i < usageCount ? "bg-amber-400" : "bg-zinc-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">
                {usageCount} of {freeLimit} free scan
                {freeLimit === 1 ? "" : "s"} used
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
