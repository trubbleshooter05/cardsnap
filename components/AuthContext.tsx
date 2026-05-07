"use client";

import { createContext, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

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
