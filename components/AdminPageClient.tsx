"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/components/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { waitForAccessToken } from "@/lib/wait-for-access-token";

export function AdminPageClient() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  const refreshStatus = useCallback(async () => {
    if (!user?.id) {
      setIsAdmin(null);
      return;
    }
    setChecking(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const token = await waitForAccessToken(supabase, { context: "admin-status" });
      if (!token) {
        setIsAdmin(false);
        return;
      }
      const res = await fetch("/api/admin/status", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) {
        setIsAdmin(false);
        return;
      }
      const data = (await res.json()) as { isAdmin?: boolean };
      setIsAdmin(Boolean(data.isAdmin));
    } finally {
      setChecking(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    if (!user?.id) {
      setIsAdmin(null);
      return;
    }
    void refreshStatus();
  }, [loading, user?.id, refreshStatus]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            CardSnap operator
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Admin access</h1>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Sign in with the email listed in <code className="text-zinc-300">CARDSNAP_ADMIN_EMAILS</code>{" "}
            for unlimited scans while testing.
          </p>
        </div>

        {loading || checking ? (
          <p className="text-sm text-zinc-500">Checking session…</p>
        ) : !user ? (
          <button
            type="button"
            onClick={() => setAuthOpen(true)}
            className="h-11 rounded-xl bg-white text-sm font-semibold text-zinc-950"
          >
            Sign in
          </button>
        ) : isAdmin ? (
          <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <p className="text-sm font-semibold text-emerald-200">Unlimited scans active</p>
            <p className="text-sm text-zinc-300">{user.email}</p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-zinc-950"
            >
              Open scanner
            </Link>
          </div>
        ) : (
          <div className="space-y-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5">
            <p className="text-sm font-semibold text-rose-200">Not an admin account</p>
            <p className="text-sm text-zinc-300">
              Signed in as {user.email}. Add this email to{" "}
              <code className="text-zinc-200">CARDSNAP_ADMIN_EMAILS</code> in your env, redeploy, then
              refresh.
            </p>
          </div>
        )}

        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to home
        </Link>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signin" />
    </div>
  );
}
