"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

/**
 * Supabase email confirmation redirect target.
 * Supabase sends the user here after they click the confirmation link.
 * The URL fragment (#access_token=...) or query string contains the session.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const handle = async () => {
      try {
        // getSession picks up the tokens from the URL hash automatically
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          // Try exchangeCodeForSession for PKCE-style flows
          const params = new URLSearchParams(window.location.search);
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
        // Small delay so the user sees the success message
        setTimeout(() => router.replace("/"), 1500);
      } catch {
        setStatus("error");
      }
    };

    handle();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] px-4">
      <div className="max-w-sm text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-800 border-t-amber-400" />
            <p className="mt-4 text-sm text-zinc-400">Confirming your account…</p>
          </>
        )}
        {status === "ok" && (
          <>
            <p className="text-3xl">✓</p>
            <p className="mt-3 text-lg font-bold text-white">Email confirmed!</p>
            <p className="mt-1 text-sm text-zinc-400">Signing you in…</p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-lg font-bold text-white">Confirmation failed</p>
            <p className="mt-1 text-sm text-zinc-400">
              The link may have expired. Try signing up again or{" "}
              <a href="/" className="text-amber-400 underline">
                go home
              </a>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
