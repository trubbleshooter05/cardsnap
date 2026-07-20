"use client";

import { createContext, useEffect, useRef, useState } from "react";
import { signupDedupeKey, trackSignUp } from "@/lib/ga4-funnel";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";


const NEW_ACCOUNT_MS = 120_000;

function maybeTrackSignUp(event: string, user: User | undefined) {
  if (event !== "SIGNED_IN" || !user?.id || typeof window === "undefined") return;

  const dedupeKey = signupDedupeKey(user.id);
  if (window.sessionStorage.getItem(dedupeKey)) return;

  const pendingMethod = window.sessionStorage.getItem(
    "cardsnap:pending_sign_up_method"
  );
  const createdMs = user.created_at ? new Date(user.created_at).getTime() : 0;
  const isNewAccount = createdMs > 0 && Date.now() - createdMs < NEW_ACCOUNT_MS;

  if (!isNewAccount && !pendingMethod) return;

  const provider = user.app_metadata?.provider;
  const method = (
    pendingMethod === "email" || pendingMethod === "google"
      ? pendingMethod
      : provider === "google"
        ? "google"
        : "email"
  ) as "email" | "google";

  trackSignUp(method, user.id);
}

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Lazy init to avoid issues during SSR/build when env vars may be missing
  const supabaseRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createSupabaseBrowserClient();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    // Check current session
    const initAuth = async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[cardsnap:auth]", "init: getSession", {
          hasSession: Boolean(session),
        });
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Auth init error", err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[cardsnap:auth]", "onAuthStateChange", {
        event,
        hasSession: Boolean(session),
        userId: session?.user?.id,
      });
      maybeTrackSignUp(event, session?.user ?? undefined);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await getSupabase().auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
