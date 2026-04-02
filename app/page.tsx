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
  const scansLabel = isPro
    ? "Pro — unlimited scans"
    : `${usageCount} of ${limit} free scans used`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/cards"
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          Card values
        </Link>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          {userId ? scansLabel : "…"}
        </span>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 pb-16 pt-8 sm:pt-12">
        <h1 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Is your card worth grading?
        </h1>
        <p className="mt-3 max-w-md text-center text-base text-zinc-600 dark:text-zinc-400">
          Enter any sports card — get instant value comps and a grading verdict
        </p>

        <div className="mt-10 w-full flex flex-col items-center">
          <ScanForm disabled={loading} onSubmit={handleSubmit} />

          {loading && (
            <div
              className="mt-10 flex flex-col items-center gap-3"
              aria-live="polite"
            >
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-800 dark:border-zinc-600 dark:border-t-zinc-200" />
              <span className="text-sm text-zinc-500">Analyzing your card…</span>
            </div>
          )}

          {result && !loading && (
            <div className="mt-10 w-full flex justify-center">
              <ResultCard
                data={result}
                scanId={result.scanId}
              />
            </div>
          )}
        </div>
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
