import { persistAnonymousId } from "@/lib/anonymous-id";
import { readStoredAttribution } from "@/lib/client-attribution";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { waitForAccessToken } from "@/lib/wait-for-access-token";

export type SubscriptionPlanToggle = "annual" | "monthly";
export type ScanPackCredits = 10 | 50 | 200;

export type ProductCheckoutPayload =
  | { kind: "subscription"; plan: SubscriptionPlanToggle }
  | { kind: "pack"; credits: ScanPackCredits };

type PendingCheckoutStored =
  | { t: number; kind: "subscription"; plan: SubscriptionPlanToggle }
  | { t: number; kind: "pack"; credits: ScanPackCredits };

const PENDING_PAYWALL_CHECKOUT = "cardsnap:pendingPaywallCheckoutTs";
export const PENDING_CHECKOUT_KEY = "cardsnap:pendingCheckoutV2";

const PENDING_TTL_MS = 15 * 60 * 1000;

export function pendingFromStored(
  stored: PendingCheckoutStored
): ProductCheckoutPayload {
  return stored.kind === "subscription"
    ? { kind: "subscription", plan: stored.plan }
    : { kind: "pack", credits: stored.credits };
}

export function readPendingCheckoutStored(): PendingCheckoutStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    if (raw) {
      const o = JSON.parse(raw) as Partial<PendingCheckoutStored> | null;
      const t = typeof o?.t === "number" ? o.t : NaN;
      if (!o || !Number.isFinite(t) || Date.now() - t > PENDING_TTL_MS) {
        window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        return null;
      }
      if (
        o.kind === "subscription" &&
        (o.plan === "annual" || o.plan === "monthly")
      ) {
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
      if (!Number.isFinite(ts) || Date.now() - ts > PENDING_TTL_MS) {
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

export function setPendingCheckoutFromCta(payload: ProductCheckoutPayload) {
  if (typeof window === "undefined") return;
  try {
    const stored: PendingCheckoutStored =
      payload.kind === "subscription"
        ? { kind: "subscription", plan: payload.plan, t: Date.now() }
        : { kind: "pack", credits: payload.credits, t: Date.now() };
    window.sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(stored));
    window.sessionStorage.removeItem(PENDING_PAYWALL_CHECKOUT);
  } catch {
    /* ignore */
  }
}

export function clearPendingCheckout() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    window.sessionStorage.removeItem(PENDING_PAYWALL_CHECKOUT);
  } catch {
    /* ignore */
  }
}

/** Same POST /api/create-checkout flow as the paywall (HomePageClient). */
export async function runProductCheckoutSession(
  userId: string,
  payload: ProductCheckoutPayload
): Promise<{ ok: true; url: string } | { ok: false; reason: "no_token" | "checkout_failed" }> {
  persistAnonymousId(userId);
  const supabase = createSupabaseBrowserClient();
  const token = await waitForAccessToken(supabase, {
    context: "create-checkout",
    maxMs: 25_000,
  });
  if (!token) {
    return { ok: false, reason: "no_token" };
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

  const res = await fetch("/api/create-checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, reason: "checkout_failed" };
  }

  const { url } = (await res.json()) as { url: string };
  return { ok: true, url };
}
