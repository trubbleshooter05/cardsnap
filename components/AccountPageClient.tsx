"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/SiteNav";
import { useAuth } from "@/components/useAuth";
import { getOrCreateAnonymousId, persistAnonymousId } from "@/lib/anonymous-id";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type Usage = {
  count: number;
  isPro: boolean;
  limit: number;
};

export function AccountPageClient() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user?.id) {
      router.push("/");
    }
  }, [user?.id, authLoading, router]);

  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
    } else if (!authLoading) {
      const id = getOrCreateAnonymousId();
      setUserId(id);
      persistAnonymousId(id);
    }
  }, [user?.id, authLoading]);

  const refresh = useCallback(async (uid: string) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (user?.id) {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token) {
        headers["Authorization"] = `Bearer ${data.session.access_token}`;
      }
    }

    const res = await fetch(`/api/usage?userId=${encodeURIComponent(uid)}`, {
      cache: "no-store",
      headers,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Usage;
    setUsage(data);
    return data;
  }, [user?.id]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    void refresh(userId).finally(() => setLoading(false));
  }, [userId, refresh]);

  const handleSync = async () => {
    if (!userId || !user?.id) return;
    setSyncing(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (token) {
        await fetch("/api/sync-subscription", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await refresh(userId);
    } finally {
      setSyncing(false);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      if (!res.ok) {
        alert(
          "Billing portal unavailable. Configure the Stripe Customer Portal in your Stripe Dashboard, or try again."
        );
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!userId || !user?.id) return;
    setCheckoutLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        alert("Authentication required. Please sign in again.");
        return;
      }

      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        alert("Checkout unavailable. Check Stripe configuration.");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } finally {
      setCheckoutLoading(false);
    }
  };

  const scansLeft =
    usage && !usage.isPro
      ? Math.max(0, usage.limit - usage.count)
      : null;

  return (
    <div className="min-h-screen bg-[#09090b]">
      <SiteNav
        trailing={
          usage ? (
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full border shrink-0 ${
                usage.isPro
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {usage.isPro ? "⚡ Pro" : "Free"}
            </span>
          ) : null
        }
      />

      <main className="relative z-10 mx-auto max-w-lg px-4 pb-20 pt-10 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-500/90">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          Plan &amp; usage
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {user?.email && (
            <>Signed in as <strong className="text-zinc-300">{user.email}</strong>. </>
          )}
          Your Pro subscription is tied to your account. You can manage it across any device.
        </p>

        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-sm">
          {loading || !usage ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Plan</dt>
                <dd className="font-semibold text-white">
                  {usage.isPro ? "Pro" : "Free"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Scans</dt>
                <dd className="text-right text-zinc-200">
                  {usage.isPro ? (
                    <span className="text-amber-400 font-medium">Unlimited</span>
                  ) : (
                    <>
                      {scansLeft} free left ({usage.count} of {usage.limit} used)
                    </>
                  )}
                </dd>
              </div>
            </dl>
          )}

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              disabled={syncing || loading}
              onClick={handleSync}
              className="flex h-11 w-full items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15 disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Restore access / Sync purchase"}
            </button>

            {usage?.isPro ? (
              <button
                type="button"
                disabled={portalLoading}
                onClick={handlePortal}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-zinc-600 bg-zinc-800 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                {portalLoading ? "Opening…" : "Manage subscription"}
              </button>
            ) : (
              <button
                type="button"
                disabled={checkoutLoading || loading}
                onClick={handleUpgrade}
                className="btn-amber flex h-11 w-full items-center justify-center rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {checkoutLoading ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            )}

            <Link
              href="/"
              className="flex h-10 items-center justify-center rounded-xl text-sm text-zinc-500 hover:text-zinc-300"
            >
              ← Back to scanner
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="flex h-10 items-center justify-center rounded-xl text-sm text-zinc-500 hover:text-zinc-300"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
