"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/**
 * Supabase auth redirect target (email confirm, password reset, OAuth).
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [destination, setDestination] = useState("/");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const params = new URLSearchParams(window.location.search);
    const next = safeNextPath(params.get("next"));
    setDestination(next);

    const handle = async () => {
      try {
        console.log("[cardsnap:auth]", "callback page: resolving session from URL");
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          const code = params.get("code");
          if (code) {
            const { error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (codeErr) {
              setStatus("error");
              return;
            }
          } else {
            setStatus("error");
            return;
          }
        }
        setStatus("ok");
        setTimeout(() => router.replace(next), 800);
      } catch {
        setStatus("error");
      }
    };

    void handle();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
      <div className="max-w-sm text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-amber-400" />
            <p className="mt-4 text-sm text-zinc-400">Signing you in…</p>
          </>
        )}
        {status === "ok" && (
          <>
            <p className="text-3xl">✓</p>
            <p className="mt-3 text-lg font-bold text-white">Signed in</p>
            <p className="mt-1 text-sm text-zinc-400">
              Redirecting{destination !== "/" ? "…" : " to home…"}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-lg font-bold text-white">Sign in failed</p>
            <p className="mt-1 text-sm text-zinc-400">
              The link may have expired. Try again from{" "}
              <a href="/admin" className="text-amber-400 underline">
                admin
              </a>{" "}
              or{" "}
              <a href="/" className="text-amber-400 underline">
                home
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
