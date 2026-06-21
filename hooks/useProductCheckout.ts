"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "@/components/useAuth";
import {
  AUTH_MODAL_DISMISSED_EVENT,
  requestOpenAuthModal,
} from "@/lib/auth-events";
import { getOrCreateAnonymousId, persistAnonymousId } from "@/lib/anonymous-id";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import {
  trackCheckoutStarted,
  trackUpgradeClicked,
  type Ga4CheckoutSource,
} from "@/lib/ga4-funnel";
import {
  clearPendingCheckout,
  pendingFromStored,
  readPendingCheckoutStored,
  runProductCheckoutSession,
  setPendingCheckoutFromCta,
  type ProductCheckoutPayload,
  type ScanPackCredits,
  type SubscriptionPlanToggle,
} from "@/lib/product-checkout-client";

const AUTH_LOG = "[cardsnap:auth]";

type Options = {
  onPostLoginCheckout?: () => void;
  analyticsSource?: Ga4CheckoutSource;
};

export function useProductCheckout(options: Options = {}) {
  const { onPostLoginCheckout, analyticsSource = "pricing" } = options;
  const { user, loading: authLoading } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const checkoutInFlightRef = useRef(false);
  const pendingCheckoutRef = useRef<ProductCheckoutPayload | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] =
    useState<SubscriptionPlanToggle | null>(null);
  const [packLoading, setPackLoading] = useState<
    Partial<Record<ScanPackCredits, boolean>>
  >({});

  useLayoutEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      return;
    }
    const anonId = getOrCreateAnonymousId();
    setUserId(anonId);
    persistAnonymousId(anonId);
  }, [user?.id]);

  const executeCheckout = useCallback(
    async (source: "cta" | "post_login", payload: ProductCheckoutPayload) => {
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
      if (isSub) setSubscriptionLoading(payload.plan);
      else setPackLoading((prev) => ({ ...prev, [payload.credits]: true }));

      try {
        const result = await runProductCheckoutSession(uid, payload);
        if (!result.ok) {
          if (result.reason === "no_token") {
            alert("Authentication required. Please sign in again.");
          } else {
            alert("Checkout unavailable. Check Stripe configuration.");
          }
          return;
        }
        trackCheckoutStarted(
          payload,
          source === "post_login" ? "post_login" : analyticsSource
        );
        window.location.href = result.url;
      } finally {
        if (isSub) setSubscriptionLoading(null);
        else if (payload.kind === "pack") {
          setPackLoading((prev) => ({ ...prev, [payload.credits]: false }));
        }
        checkoutInFlightRef.current = false;
      }
    },
    [user?.id, userId, analyticsSource]
  );

  const startCheckout = useCallback(
    (payload: ProductCheckoutPayload) => {
      trackUpgradeClicked(payload, analyticsSource);
      if (!user?.id) {
        pendingCheckoutRef.current = payload;
        setPendingCheckoutFromCta(payload);
        requestOpenAuthModal();
        return;
      }
      void executeCheckout("cta", payload);
    },
    [user?.id, executeCheckout, analyticsSource]
  );

  useEffect(() => {
    const onAuthModalDismissed = () => {
      window.setTimeout(() => {
        void (async () => {
          const supabase = createSupabaseBrowserClient();
          const { data } = await supabase.auth.getSession();
          if (data.session) return;
          pendingCheckoutRef.current = null;
          clearPendingCheckout();
        })();
      }, 450);
    };
    window.addEventListener(AUTH_MODAL_DISMISSED_EVENT, onAuthModalDismissed);
    return () => {
      window.removeEventListener(AUTH_MODAL_DISMISSED_EVENT, onAuthModalDismissed);
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    const fromRef = pendingCheckoutRef.current;
    const stored = readPendingCheckoutStored();
    const pending = fromRef ?? (stored ? pendingFromStored(stored) : null);
    if (!pending) return;
    if (checkoutInFlightRef.current) return;

    pendingCheckoutRef.current = null;
    clearPendingCheckout();
    onPostLoginCheckout?.();
    void executeCheckout("post_login", pending);
  }, [user?.id, authLoading, executeCheckout, onPostLoginCheckout]);

  return {
    startCheckout,
    subscriptionLoading,
    packLoading,
    isSignedIn: Boolean(user?.id),
  };
}
