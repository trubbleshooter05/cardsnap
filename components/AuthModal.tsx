"use client";

import { useEffect, useRef, useState } from "react";
import { markPendingSignUp } from "@/lib/ga4-funnel";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
  /** After OAuth, land here (defaults to current path). */
  redirectPath?: string;
};

function authCallbackUrl(redirectPath: string): string {
  const origin =
    (typeof window !== "undefined" ? window.location.origin : null) ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";
  const next = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
  redirectPath,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(initialMode);

  // The modal mounts once (in SiteNav) and is reused; re-sync the mode each
  // time it opens so purchase CTAs can land on "Create Account".
  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  const resolveRedirectPath = () => {
    if (redirectPath) return redirectPath;
    if (typeof window !== "undefined") return window.location.pathname || "/";
    return "/";
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const supabase = getSupabase();
      if (mode === "signup") markPendingSignUp("google");
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authCallbackUrl(resolveRedirectPath()),
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = getSupabase();
      if (mode === "reset") {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          (typeof window !== "undefined" ? window.location.origin : "");
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appUrl}/auth/callback?next=/update-password`,
        });
        if (resetError) {
          setError(resetError.message);
          return;
        }
        setError("reset_sent");
        setEmail("");
        return;
      }

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          setError(signInError.message);
          return;
        }
      } else {
        markPendingSignUp("email");
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: authCallbackUrl(resolveRedirectPath()),
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        setError("success");
        setEmail("");
        setPassword("");
        return;
      }

      console.log("[cardsnap:auth]", "auth: sign in success, closing modal");
      setEmail("");
      setPassword("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || googleLoading;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm max-h-[min(90dvh,640px)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/95 p-6 pt-12">
        <h2 className="text-xl font-bold text-white">
          {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          {mode === "signin"
            ? "Access your Pro subscription across devices"
            : mode === "signup"
            ? "Sign up to unlock Pro features"
            : "Enter your email and we'll send a reset link"}
        </p>

        {mode !== "reset" ? (
          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={busy}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-zinc-600 bg-zinc-800 text-sm font-semibold text-white transition hover:bg-zinc-750 hover:border-zinc-500 disabled:opacity-60"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-700" />
              <span className="text-xs text-zinc-500">or use email</span>
              <div className="h-px flex-1 bg-zinc-700" />
            </div>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className={mode === "reset" ? "mt-6 space-y-4" : "mt-4 space-y-4"}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={busy}
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          {mode !== "reset" && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={busy}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                placeholder="••••••••"
              />
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setError(""); }}
                  disabled={busy}
                  className="mt-1.5 text-xs text-zinc-500 hover:text-amber-400"
                >
                  Forgot password?
                </button>
              )}
            </div>
          )}

          {error === "success" ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              ✓ Check your email and click the confirmation link, then come back to sign in.
            </div>
          ) : error === "reset_sent" ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              ✓ Password reset email sent. Check your inbox.
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="btn-amber mt-4 w-full"
          >
            {loading
              ? "Loading…"
              : mode === "signin"
                ? "Sign In"
                : mode === "signup"
                ? "Create Account"
                : "Send Reset Link"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {mode === "reset" ? (
            <>
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(""); }}
                disabled={busy}
                className="text-amber-400 hover:underline"
              >
                Back to sign in
              </button>
            </>
          ) : (
            <>
              {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError("");
                  setEmail("");
                  setPassword("");
                }}
                disabled={busy}
                className="text-amber-400 hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </>
          )}
        </p>

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="absolute right-3 top-3 rounded-lg p-2 text-lg leading-none text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
