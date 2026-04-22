"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
};

export function AuthModal({
  open,
  onClose,
  initialMode = "signin",
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          (typeof window !== "undefined" ? window.location.origin : "");

        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${appUrl}/auth/callback`,
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

      // Sign-in was successful
      setEmail("");
      setPassword("");
      onClose();
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              disabled={loading}
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
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
                placeholder="••••••••"
              />
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => { setMode("reset"); setError(""); }}
                  disabled={loading}
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
            disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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
          disabled={loading}
          className="absolute right-3 top-3 rounded-lg p-2 text-lg leading-none text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
