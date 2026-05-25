"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScanForm } from "@/components/ScanForm";
import { ScanGate, type SubscriptionPlanToggle } from "@/components/ScanGate";
import { SiteNav } from "@/components/SiteNav";
import { PageAttribution } from "@/components/PageAttribution";
import { OpportunitiesWidget } from "@/components/OpportunitiesWidget";
import { useAuth } from "@/components/useAuth";
import {
  requestOpenAuthModal,
  AUTH_MODAL_DISMISSED_EVENT,
} from "@/lib/auth-events";
import { waitForAccessToken } from "@/lib/wait-for-access-token";
import { getOrCreateAnonymousId, persistAnonymousId } from "@/lib/anonymous-id";
import { readStoredAttribution } from "@/lib/client-attribution";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { ScanResultPayload } from "@/lib/types";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";
import { EmailCapture } from "@/components/EmailCapture";
import { CardCompsTest } from "@/components/CardCompsTest";

const ResultCard = dynamic(
  () =>
    import("@/components/ResultCard").then((m) => ({ default: m.ResultCard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-8">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-amber-400" />
      </div>
    ),
  }
);

type ScanResponse = ScanResultPayload & {
  scanId: string;
  scansUsedThisMonth: number;
  freeScansUsed?: number;
  freeScanLimit: number;
  isPro: boolean;
};

type UsagePayload = {
  count: number;
  isPro: boolean;
  limit: number;
};

const LOG = "[cardsnap]";
const AUTH_LOG = "[cardsnap:auth]";
const SHOW_CARD_COMPS = process.env.NODE_ENV !== "production";
const ANALYSIS_PROGRESS_MESSAGES = [
  "Finding raw card comps",
  "Comparing PSA 9 and PSA 10 values",
  "Estimating grading fees",
  "Calculating ROI verdict",
] as const;

const PENDING_PAYWALL_CHECKOUT = "cardsnap:pendingPaywallCheckoutTs";
/** Current session handoff after sign-in (subscription plan or pack). */
const PENDING_CHECKOUT_KEY = "cardsnap:pendingCheckoutV2";

type PendingCheckoutStored =
  | { t: number; kind: "subscription"; plan: SubscriptionPlanToggle }
  | { t: number; kind: "pack"; credits: 10 | 50 | 200 };

type PendingCheckout =
  | { kind: "subscription"; plan: SubscriptionPlanToggle }
  | { kind: "pack"; credits: 10 | 50 | 200 };

function pendingFromStored(stored: PendingCheckoutStored): PendingCheckout {
  return stored.kind === "subscription"
    ? { kind: "subscription", plan: stored.plan }
    : { kind: "pack", credits: stored.credits };
}

function HeroVisual() {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-2xl shadow-black/40">
        <Image
          src="/cardsnap-homepage-visual.svg"
          alt="CardSnap compares raw card value, PSA 9 downside, PSA 10 upside, and grading ROI verdict"
          width={960}
          height={720}
          priority
          className="block aspect-[4/3] w-full object-cover"
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-zinc-400 sm:text-xs">
        <span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-2">
          Raw value
        </span>
        <span className="rounded-lg border border-zinc-800 bg-zinc-900/70 px-2 py-2">
          PSA 9 risk
        </span>
        <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-2 text-amber-300">
          PSA 10 upside
        </span>
      </div>
    </div>
  );
}

function readPendingCheckoutStored(): PendingCheckoutStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<PendingCheckoutStored> | null;
      const t =
        typeof o?.t === "number" ? o.t : NaN;
      if (
        !o ||
        !Number.isFinite(t) ||
        Date.now() - t > 15 * 60 * 1000
      ) {
        window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        return null;
      }
      if (o.kind === "subscription" && (o.plan === "annual" || o.plan === "monthly")) {
        return { kind: "subscription", plan: o.plan, t };
      }
      if (
        o.kind === "pack" &&
        (o.credits === 10 || o.credits === 50 || o.credits === 200)
      ) {
        return { kind: "pack", credits: o.credits, t };
      }
      window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      return null;
    }
    const legacy = window.sessionStorage.getItem(PENDING_PAYWALL_CHECKOUT);
    if (legacy) {
      const ts = Number(legacy);
      if (!Number.isFinite(ts) || Date.now() - ts > 15 * 60 * 1000) {
        window.sessionStorage.removeItem(PENDING_PAYWALL_CHECKOUT);
        return null;
      }
      return { kind: "subscription", plan: "annual", t: ts };
    }
    return null;
  } catch {
    try {
      window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      window.sessionStorage.removeItem(PENDING_PAYWALL_CHECKOUT);
    } catch {
      /* ignore */
    }
    return null;
  }
}

function setPendingCheckoutFromCta(pending: PendingCheckout) {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingCheckoutStored =
      pending.kind === "subscription"
        ? { kind: "subscription", plan: pending.plan, t: Date.now() }
        : { kind: "pack", credits: pending.credits, t: Date.now() };
    window.sessionStorage.setItem(
      PENDING_CHECKOUT_KEY,
      JSON.stringify(payload)
    );
    window.sessionStorage.removeItem(PENDING_PAYWALL_CHECKOUT);
  } catch {
    /* ignore */
  }
}

function clearPaywallPending() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    window.sessionStorage.removeItem(PENDING_PAYWALL_CHECKOUT);
  } catch {
    /* ignore */
  }
}

/*
 * Where `result` / `loading` / paywall can change (HomePageClient only):
 * - setResult(null): start of handleSubmit; "New scan" in ResultCard onNewScan.
 * - setLoading(true|false): handleSubmit start | handleSubmit finally (always false after scan attempt).
 * - setGateOpen(true): pre-scan free limit; HTTP 402.
 * - setGateOpen(false): successful 200 with scanId; ScanGate onClose.
 */

/**
 * Heuristic that the JSON matches POST /api/scan success shape: flat merged payload
 * (see mergeScanResults + route spread) plus scanId, usage, isPro.
 *
 * Server always sends: ...merged, scanId, freeScansUsed, isPro — with worthGrading set in merge
 * from ROI (boolean). A previous bug required non-empty confirmedName; models can return "" which
 * made validation fail and (worse) skipped setGateOpen(false) after a good 200.
 */
function hasValidMergedScanData(data: ScanResponse): boolean {
  if (data?.scanId == null || String(data.scanId).length === 0) return false;

  const hasLabel =
    (typeof data.confirmedName === "string" && data.confirmedName.trim().length > 0) ||
    (typeof data.player === "string" && data.player.trim().length > 0) ||
    (typeof data.verdictReason === "string" && data.verdictReason.length > 0);

  if (!hasLabel) return false;

  if (typeof data.worthGrading === "boolean") return true;

  return Boolean(
    data.roi &&
      (data.roi.headlineVerdict === "grade" || data.roi.headlineVerdict === "skip")
  );
}

const SESSION_RACE_MS = 5_000;

/** Avoid hanging forever if Supabase getSession() never settles. */
async function getAccessTokenRaced(
  supabase: ReturnType<typeof createSupabaseBrowserClient>
): Promise<string | undefined> {
  try {
    const outcome = await Promise.race([
      supabase.auth.getSession().then((r) => ({ kind: "ok" as const, r })),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), SESSION_RACE_MS)
      ),
    ]);
    if (outcome === "timeout") return undefined;
    return outcome.r.data.session?.access_token;
  } catch {
    return undefined;
  }
}

export function HomePageClient() {
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [freeLimit, setFreeLimit] = useState(FREE_SCAN_LIMIT);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [packBuying, setPackBuying] = useState<
    Partial<Record<10 | 50 | 200, boolean>>
  >({});
  const [reportCheckouting, setReportCheckouting] = useState(false);
  const [checkoutSyncing, setCheckoutSyncing] = useState(false);
  const [progressIndex, setProgressIndex] = useState(0);

  const usageAbortRef = useRef<AbortController | null>(null);
  /** If a recent successful scan said `isPro: true`, do not let a stale /api/usage response clear Pro. */
  const lastProFromScanRef = useRef<{ pro: boolean; t: number } | null>(null);
  const scanInFlightRef = useRef(false);
  const pendingPaywallCheckoutRef = useRef<PendingCheckout | null>(null);
  const checkoutInFlightRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // IDs for /api/usage and /api/scan. Never wait for auth init: anonymous ID must be ready
  // before getSession() finishes so the first free scan works with no login (limits are enforced on the server, not with a login wall).
  useLayoutEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      return;
    }
    const anonId = getOrCreateAnonymousId();
    setUserId(anonId);
    persistAnonymousId(anonId);
  }, [user?.id]);

  useEffect(() => {
    lastProFromScanRef.current = null;
  }, [userId]);

  useEffect(() => {
    if (!loading) {
      setProgressIndex(0);
      return;
    }

    setProgressIndex(0);
    const id = window.setInterval(() => {
      setProgressIndex((i) => (i + 1) % ANALYSIS_PROGRESS_MESSAGES.length);
    }, 1700);

    return () => window.clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!result || loading) return;

    window.requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [result, loading]);

  const refreshUsage = useCallback(
    async (uid: string) => {
      usageAbortRef.current?.abort();
      const ac = new AbortController();
      usageAbortRef.current = ac;
      const { signal } = ac;

      const supabase = createSupabaseBrowserClient();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (user?.id) {
        const token = await getAccessTokenRaced(supabase);
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      let res: Response;
      try {
        res = await fetch(
          `/api/usage?userId=${encodeURIComponent(uid)}`,
          { cache: "no-store", headers, signal }
        );
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          console.log(
            LOG,
            "usage fetch aborted (newer request or scan started)"
          );
          return null;
        }
        console.error(LOG, "usage fetch failed", e);
        return null;
      }

      if (!res.ok) return null;
      const data = (await res.json()) as UsagePayload;
      if (signal.aborted) return null;

      let isPro = data.isPro;
      const recent = lastProFromScanRef.current;
      if (
        recent &&
        recent.pro === true &&
        isPro === false &&
        Date.now() - recent.t < 10_000
      ) {
        console.log(
          LOG,
          "pro/usage: recent successful scan was Pro; ignoring stale usage isPro=false"
        );
        isPro = true;
      }

      setUsageCount(data.count);
      setFreeLimit(data.limit);
      setIsPro(isPro);
      console.log(LOG, "subscription/pro resolved (usage API)", {
        isPro,
        count: data.count,
        limit: data.limit,
      });
      return { ...data, isPro };
    },
    [user?.id]
  );

  const runProductCheckout = useCallback(
    async (
      source: "cta" | "post_login",
      payload:
        | { kind: "subscription"; plan: SubscriptionPlanToggle }
        | { kind: "pack"; credits: 10 | 50 | 200 }
    ) => {
      const uid = user?.id ?? userId;
      if (!uid) {
        console.warn(AUTH_LOG, "upgrade: no user id — abort", { source });
        return;
      }
      if (checkoutInFlightRef.current) {
        console.log(AUTH_LOG, "upgrade: already in progress — skip", { source });
        return;
      }
      checkoutInFlightRef.current = true;
      const isSub = payload.kind === "subscription";
      if (isSub) setUpgrading(true);
      else
        setPackBuying((prev) => ({ ...prev, [payload.credits]: true }));
      try {
        persistAnonymousId(uid);
        const supabase = createSupabaseBrowserClient();
        console.log(AUTH_LOG, "upgrade: wait for access token", {
          source,
          uid: uid.slice(0, 8),
        });
        const token = await waitForAccessToken(supabase, {
          context: "create-checkout",
          maxMs: 25_000,
        });
        if (!token) {
          console.warn(AUTH_LOG, "upgrade: no token after wait", { source });
          alert("Authentication required. Please sign in again.");
          return;
        }
        const body =
          payload.kind === "subscription"
            ? {
                subscriptionPlan: payload.plan,
                attribution: readStoredAttribution(),
              }
            : {
                packCredits: payload.credits,
                attribution: readStoredAttribution(),
              };
        console.log(AUTH_LOG, "upgrade: POST /api/create-checkout", { source, body });
        const res = await fetch("/api/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          console.warn(AUTH_LOG, "upgrade: checkout HTTP", res.status);
          alert("Checkout unavailable. Check Stripe configuration.");
          return;
        }
        const { url } = (await res.json()) as { url: string };
        console.log(AUTH_LOG, "upgrade: redirecting to Stripe", { source });
        window.location.href = url;
      } finally {
        if (isSub) setUpgrading(false);
        else if (payload.kind === "pack")
          setPackBuying((prev) => ({ ...prev, [payload.credits]: false }));
        checkoutInFlightRef.current = false;
      }
    },
    [userId, user?.id]
  );

  // Fetch initial usage
  useEffect(() => {
    if (!userId) return;
    void refreshUsage(userId);
  }, [userId, refreshUsage]);

  // On checkout return: sync subscription for Pro, refresh usage for packs
  useEffect(() => {
    if (typeof window === "undefined" || !userId || !user?.id) return;
    const params = new URLSearchParams(window.location.search);
    const upgraded = params.get("upgraded") === "1";
    const packPurchase = params.get("pack_purchase") === "1";
    if (!upgraded && !packPurchase) return;

    let cancelled = false;

    const syncOnce = async () => {
      if (cancelled) return;
      setCheckoutSyncing(true);

      try {
        const supabase = createSupabaseBrowserClient();
        const token = await getAccessTokenRaced(supabase);

        if (upgraded && token) {
          await fetch("/api/sync-subscription", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      } catch (err) {
        console.error("sync error", err);
      } finally {
        if (!cancelled) {
          await refreshUsage(userId);
          window.history.replaceState({}, "", "/");
          setCheckoutSyncing(false);
        }
      }
    };

    syncOnce();
    return () => {
      cancelled = true;
    };
  }, [userId, user?.id, refreshUsage]);

  useEffect(() => {
    console.log(LOG, "state: loading →", loading);
  }, [loading]);

  useEffect(() => {
    console.log(
      LOG,
      "state: result →",
      result
        ? { scanId: result.scanId, isPro: result.isPro, hasMerged: hasValidMergedScanData(result) }
        : null
    );
  }, [result]);

  useEffect(() => {
    console.log(LOG, "state: paywall / gate open →", gateOpen);
  }, [gateOpen]);

  useEffect(() => {
    console.log(LOG, "state: isPro (ui) →", isPro, {
      usageCount,
      freeLimit,
    });
  }, [isPro, usageCount, freeLimit]);

  useEffect(() => {
    const onAuthModalDismissed = () => {
      window.setTimeout(() => {
        void (async () => {
          const supabase = createSupabaseBrowserClient();
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            console.log(
              AUTH_LOG,
              "auth modal closed, session found — keep paywall checkout intent (handoff will run)"
            );
            return;
          }
          console.log(
            AUTH_LOG,
            "auth modal dismissed, no session after delay — clear paywall checkout intent"
          );
          pendingPaywallCheckoutRef.current = null;
          clearPaywallPending();
        })();
      }, 450);
    };
    window.addEventListener(AUTH_MODAL_DISMISSED_EVENT, onAuthModalDismissed);
    return () => {
      window.removeEventListener(AUTH_MODAL_DISMISSED_EVENT, onAuthModalDismissed);
    };
  }, []);

  // After sign-in from paywall CTA, continue to Stripe (desktop parity; no second click).
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    const fromRef = pendingPaywallCheckoutRef.current;
    const stored = readPendingCheckoutStored();
    const pending = fromRef ?? (stored ? pendingFromStored(stored) : null);
    if (!pending) return;
    if (checkoutInFlightRef.current) {
      console.log(
        AUTH_LOG,
        "post-login: checkout already in flight — skip duplicate"
      );
      return;
    }
    console.log(AUTH_LOG, "auth: session ready — handoff to checkout", {
      pending,
      userId: user.id,
    });
    pendingPaywallCheckoutRef.current = null;
    clearPaywallPending();
    setGateOpen(false);
    void runProductCheckout("post_login", pending);
  }, [user?.id, authLoading, runProductCheckout]);

  const handleSubmit = async (payload: {
    cardName: string;
    condition: string;
  }) => {
    if (scanInFlightRef.current) return;
    scanInFlightRef.current = true;
    setLoading(true);
    setResult(null);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      // Defensive: allow submit the instant layout has run (or sync fallback for edge races).
      const scanUserId = userId ?? getOrCreateAnonymousId();
      if (!scanUserId) return;

      // Fresh entitlement before gating; uses return value (React state is async).
      const preUsage = await refreshUsage(scanUserId);
      if (preUsage !== null) {
        if (!preUsage.isPro && preUsage.count >= preUsage.limit) {
          console.log(LOG, "paywall: pre-scan (free limit)", {
            isPro: preUsage.isPro,
            used: preUsage.count,
            limit: preUsage.limit,
          });
          setGateOpen(true);
          return;
        }
      } else {
        console.log(
          LOG,
          "pre-scan: usage fetch failed or aborted — not blocking; server will enforce"
        );
      }

      // Drop any in-flight /api/usage from before the scan so a late response cannot clobber the result.
      usageAbortRef.current?.abort();

      console.log(LOG, "scan: start POST /api/scan (loading on)", {
        guest: !user?.id,
      });

      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 120_000);

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (user?.id) {
        const supabase = createSupabaseBrowserClient();
        const token = await waitForAccessToken(supabase, {
          context: "scan",
          maxMs: 15_000,
        });
        if (!token) {
          alert("Your session is still loading. Please try again in a moment.");
          return;
        }
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        cache: "no-store",
        headers,
        body: JSON.stringify({
          cardName: payload.cardName,
          condition: payload.condition,
          userId: scanUserId,
        }),
        signal: controller.signal,
      });

      if (res.status === 402) {
        await refreshUsage(scanUserId);
        console.log(LOG, "paywall: HTTP 402 from /api/scan (payment required)");
        setGateOpen(true);
        return;
      }

      if (!res.ok) {
        console.log(LOG, "scan: !res.ok — early return (no setResult)", res.status);
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
      console.log(LOG, "scan: parsed /api/scan JSON (full object)", data);
      const mergedOk = hasValidMergedScanData(data);
      console.log(LOG, "scan: hasValidMergedScanData(data) =", mergedOk, {
        topLevelKeys: data && typeof data === "object" ? Object.keys(data) : [],
        scanId: data?.scanId,
        scanIdType: typeof data?.scanId,
        confirmedName: data?.confirmedName,
        worthGrading: data?.worthGrading,
        worthGradingType: typeof data?.worthGrading,
        hasRoi: Boolean(data?.roi),
      });
      if (!mergedOk) {
        console.error(
          LOG,
          "HARD_FAIL: 200 from /api/scan but hasValidMergedScanData is false (full response follows)",
          data
        );
      }

      lastProFromScanRef.current = { pro: data.isPro, t: Date.now() };
      console.log(LOG, "scan: setResult(data) — calling", { scanId: data?.scanId });
      setResult(data);
      console.log(LOG, "scan: setResult dispatched");
      const used = data.freeScansUsed ?? data.scansUsedThisMonth;
      const lim = data.freeScanLimit ?? FREE_SCAN_LIMIT;
      setUsageCount(used);
      setFreeLimit(lim);
      setIsPro(data.isPro);
      persistAnonymousId(scanUserId);

      // Any successful persisted scan (200 + scanId) must dismiss the paywall. Do not gate this on
      // heuristics — stale gate + failed hasValidMergedScanData left the modal open on success.
      if (data?.scanId != null && String(data.scanId).length > 0) {
        console.log(LOG, "scan: setGateOpen(false) — server saved scan (scanId present)");
        setGateOpen(false);
      } else {
        console.warn(LOG, "scan: setGateOpen not cleared — missing scanId on 200");
      }

      if (mergedOk) {
        console.log(LOG, "scan: success (merged payload matches validator)", {
          isPro: data.isPro,
          used,
          limit: lim,
        });
      } else {
        console.warn(
          LOG,
          "scan: 200 and UI updated but merge heuristic false — check HARD_FAIL log above"
        );
      }

      // Re-sync usage in background; stale responses are handled via abort + lastProFromScan.
      void refreshUsage(scanUserId);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        alert("Request timed out. Check your connection and try again.");
      } else {
        alert("Failed to analyze card. Check your connection and try again.");
        console.error(err);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      scanInFlightRef.current = false;
      setLoading(false);
      console.log(LOG, "scan: finally — loading off");
    }
  };

  const handleSubscribe = useCallback((plan: SubscriptionPlanToggle) => {
    console.log(AUTH_LOG, "paywall CTA: subscribe clicked", {
      hasUser: Boolean(user?.id),
      plan,
    });
    if (!user?.id) {
      const pending: PendingCheckout = { kind: "subscription", plan };
      pendingPaywallCheckoutRef.current = pending;
      setPendingCheckoutFromCta({ kind: "subscription", plan });
      console.log(AUTH_LOG, "auth: opening sign-in (pending checkout after login)");
      requestOpenAuthModal();
      return;
    }
    setGateOpen(false);
    void runProductCheckout("cta", { kind: "subscription", plan });
  }, [user?.id, runProductCheckout]);

  const handlePackPurchase = useCallback(
    (credits: 10 | 50 | 200) => {
      console.log(AUTH_LOG, "paywall CTA: pack clicked", {
        hasUser: Boolean(user?.id),
        credits,
      });
      if (!user?.id) {
        const pending: PendingCheckout = { kind: "pack", credits };
        pendingPaywallCheckoutRef.current = pending;
        setPendingCheckoutFromCta({ kind: "pack", credits });
        requestOpenAuthModal();
        return;
      }
      setGateOpen(false);
      void runProductCheckout("cta", { kind: "pack", credits });
    },
    [user?.id, runProductCheckout]
  );

  const handleReportCheckout = async () => {
    if (reportCheckouting) return;
    setReportCheckouting(true);
    try {
      const res = await fetch("/api/create-report-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: result?.scanId,
          attribution: readStoredAttribution(),
        }),
      });
      if (!res.ok) {
        alert("Single report checkout is unavailable right now.");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } finally {
      setReportCheckouting(false);
    }
  };

  const scansLeft = Math.max(0, freeLimit - usageCount);
  const scanDisabled = loading || checkoutSyncing;
  const progressMessage = ANALYSIS_PROGRESS_MESSAGES[progressIndex];

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Lighter on mobile: single glow, hidden extra blurs on small screens */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-amber-500/10 blur-[80px] sm:hidden" />
        <div className="absolute -top-40 left-1/2 hidden h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-amber-500/8 blur-[120px] sm:block" />
        <div className="absolute top-1/3 -right-32 hidden h-[400px] w-[400px] rounded-full bg-orange-600/5 blur-[100px] md:block" />
        <div className="absolute bottom-0 -left-32 hidden h-[300px] w-[300px] rounded-full bg-amber-400/4 blur-[80px] lg:block" />
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
              {isPro ? "⚡ Pro" : `${scansLeft} scans left`}
            </span>
          ) : null
        }
      />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-8 sm:px-6 sm:pt-12">
        {checkoutSyncing && (
          <div
            className="mb-6 w-full max-w-md rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
            role="status"
          >
            <p className="font-semibold">Activating Pro…</p>
            <p className="mt-1 text-xs text-amber-200/90">
              Syncing your subscription. One moment.
            </p>
          </div>
        )}

        <section className="grid w-full items-center gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/8 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Should I grade my card?
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Know if your card is worth grading{" "}
              <span className="gradient-text">before you pay PSA fees.</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg font-semibold leading-snug text-amber-300">
              CardSnap answers the collector question directly: should I grade
              this card, sell it raw, or wait?
            </p>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              Enter the card name and compare raw value, PSA 9 downside, PSA 10
              upside, and grading cost in seconds. No marketplace spreadsheet,
              no guessing from one PSA 10 comp.
            </p>

            <ul className="mt-6 grid w-full max-w-xl gap-2.5 text-left text-sm text-zinc-300 sm:grid-cols-3 lg:grid-cols-1">
              {[
                "Avoid grading fees on cards that lose money at PSA 9",
                "See raw vs PSA 9 vs PSA 10 in one result",
                "Get a grade, sell raw, or wait verdict",
              ].map((line) => (
                <li key={line} className="flex gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-3">
                  <span className="mt-0.5 shrink-0 text-amber-400" aria-hidden>
                    ✓
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 w-full max-w-xl space-y-2 text-center text-sm text-zinc-400 lg:text-left">
              <p className="font-medium text-zinc-300">
                Want the fee math without running a scan yet?
              </p>
              <p>
                Walk through the{" "}
                <Link
                  href="/psa-grading-calculator"
                  className="font-semibold text-amber-400 underline decoration-amber-500/40 underline-offset-2 hover:text-amber-300"
                >
                  sports card grading calculator
                </Link>{" "}
                (PSA ROI, hidden costs, PSA 9 vs 10). Pokémon, baseball, and
                basketball shortcuts below.
              </p>
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs lg:justify-start">
                <Link
                  href="/pokemon-card-grading-calculator"
                  className="text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  Pokémon grading calculator
                </Link>
                <Link
                  href="/baseball-card-value-checker"
                  className="text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  Baseball card value checker
                </Link>
                <Link
                  href="/basketball-card-value-checker"
                  className="text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
                >
                  Basketball card value checker
                </Link>
              </div>
            </div>

            <div className="mt-5 flex w-full max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-400 lg:justify-start">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span><strong className="text-white">3,200+</strong> analyses run</span>
              </span>
              <span className="text-zinc-700">·</span>
              <span>Built for collectors checking grading ROI</span>
            </div>

            <PageAttribution className="mt-5 w-full justify-center text-center lg:justify-start lg:text-left" />
          </div>

          <div className="flex w-full flex-col gap-5">
            <HeroVisual />

            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-6">
              {checkoutSyncing && (
                <p className="mb-3 text-center text-xs text-amber-200/90">
                  Syncing your Pro status…
                </p>
              )}
              <ScanForm
                disabled={scanDisabled}
                progressMessage={progressMessage}
                onSubmit={handleSubmit}
              />

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
                    {usageCount} of {freeLimit} free{" "}
                    {freeLimit === 1 ? "analysis" : "analyses"} used
                  </span>
                </div>
              )}
              {isPro && (
                <div className="mt-4 border-t border-zinc-800 pt-3 text-center text-xs text-amber-400 font-medium">
                  ⚡ Pro — unlimited analyses
                </div>
              )}
            </div>

            {!result && !loading && (
              <p className="text-center text-xs text-zinc-600">
                Not sure what you get?{" "}
                <a href="/sample-scan" className="text-zinc-400 underline underline-offset-2 hover:text-zinc-300">
                  See a sample analysis result →
                </a>
              </p>
            )}
          </div>
        </section>

        <OpportunitiesWidget />

        {SHOW_CARD_COMPS && <CardCompsTest />}

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
              {progressMessage}
            </span>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div ref={resultRef} className="mt-10 w-full scroll-mt-6 flex flex-col items-center">
            <ResultCard
              data={result}
              scanId={result.scanId}
              onNewScan={() => {
                setResult(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
            {!isPro && (
              <div className="w-full max-w-xl">
                <EmailCapture scanId={result.scanId} />
              </div>
            )}
          </div>
        )}
      </main>

      <ScanGate
        open={gateOpen}
        onClose={() => {
          console.log(AUTH_LOG, "paywall: closed (backdrop or Maybe later)");
          pendingPaywallCheckoutRef.current = null;
          clearPaywallPending();
          setGateOpen(false);
        }}
        onSubscribe={handleSubscribe}
        onPackPurchase={handlePackPurchase}
        onReportCheckout={handleReportCheckout}
        upgrading={upgrading}
        packBuying={packBuying}
        reportCheckouting={reportCheckouting}
      />

    </div>
  );
}

// Note: Add this import at the top:
// import { OpportunitiesWidget } from "@/components/OpportunitiesWidget";

// Then add this after the main hero section (around line 850):
// <OpportunitiesWidget />
