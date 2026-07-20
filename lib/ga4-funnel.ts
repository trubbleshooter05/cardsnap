import { whenGtagReady } from "@/lib/gtag-ready";
import type { ProductCheckoutPayload } from "@/lib/product-checkout-client";

export type Ga4FunnelEvent =
  | "paywall_shown"
  | "upgrade_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "pricing_page_view"
  | "result_viewed"
  | "report_upsell_viewed"
  | "report_upsell_clicked";

export type Ga4CheckoutSource =
  | "paywall"
  | "result_cta"
  | "pricing"
  | "account"
  | "post_login"
  | "report_upsell";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const PACK_VALUES: Record<10 | 50 | 200, number> = {
  10: 9.99,
  50: 29,
  200: 79,
};

function stripUndefined(
  params: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined)
  ) as Record<string, string | number | boolean>;
}

type QueuedCustomEvent = {
  kind: "custom";
  eventName: Ga4FunnelEvent;
  params?: Record<string, string | number | boolean | undefined>;
};

type QueuedStandardEvent = {
  kind: "standard";
  eventName: string;
  params?: Record<string, unknown>;
};

type QueuedGaEvent = QueuedCustomEvent | QueuedStandardEvent;

const gaEventQueue: QueuedGaEvent[] = [];
let gaFlushScheduled = false;

function flushGaEventQueue() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  while (gaEventQueue.length > 0) {
    const item = gaEventQueue.shift();
    if (!item) continue;
    if (item.kind === "custom") {
      window.gtag("event", item.eventName, stripUndefined(item.params ?? {}));
    } else {
      window.gtag("event", item.eventName, item.params ?? {});
    }
  }
}

function scheduleGaFlush() {
  if (gaFlushScheduled || typeof window === "undefined") return;
  gaFlushScheduled = true;
  whenGtagReady(() => {
    gaFlushScheduled = false;
    flushGaEventQueue();
  });
}

function queueStandardEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
    return;
  }
  gaEventQueue.push({ kind: "standard", eventName, params });
  scheduleGaFlush();
}

export function trackGa4FunnelEvent(
  eventName: Ga4FunnelEvent,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, stripUndefined(params ?? {}));
    return;
  }
  gaEventQueue.push({ kind: "custom", eventName, params });
  scheduleGaFlush();
}

/** Allow gtag to send before Stripe redirect (fixes under-counted begin_checkout). */
export function flushGaEventsBeforeNavigation(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    whenGtagReady(() => {
      flushGaEventQueue();
      window.setTimeout(resolve, 250);
    });
  });
}

export function signupDedupeKey(userId: string) {
  return `cardsnap:ga4:sign_up:${userId}`;
}

export function markPendingSignUp(method: "email" | "google") {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem("cardsnap:pending_sign_up_method", method);
}

export function trackSignUp(method: "email" | "google", userId?: string) {
  if (typeof window === "undefined") return;
  if (userId) {
    const key = signupDedupeKey(userId);
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  }
  window.sessionStorage.removeItem("cardsnap:pending_sign_up_method");
  queueStandardEvent("sign_up", { method });
}

export function trackCardCreated(params: {
  scan_id: string;
  verdict: "grade" | "skip";
  is_pro: boolean;
  card_name?: string;
}) {
  queueStandardEvent("card_created", params);
}

export function checkoutPayloadToGaParams(payload: ProductCheckoutPayload) {
  if (payload.kind === "subscription") {
    return {
      product_type: "subscription" as const,
      plan: payload.plan,
      value: payload.plan === "monthly" ? 9.99 : 99,
    };
  }
  return {
    product_type: "scan_pack" as const,
    pack_credits: payload.credits,
    value: PACK_VALUES[payload.credits],
  };
}

export function trackUpgradeClicked(
  payload: ProductCheckoutPayload,
  source: Ga4CheckoutSource
) {
  trackGa4FunnelEvent("upgrade_clicked", {
    source,
    ...checkoutPayloadToGaParams(payload),
  });
}

function trackBeginCheckout(
  params: {
    value: number;
    item_id: string;
    item_name: string;
  },
  transactionId?: string
) {
  const payload: Record<string, unknown> = {
    currency: "USD",
    value: params.value,
    items: [
      {
        item_id: params.item_id,
        item_name: params.item_name,
        quantity: 1,
      },
    ],
  };
  if (transactionId) payload.transaction_id = transactionId;
  queueStandardEvent("begin_checkout", payload);
}

function checkoutItemForPayload(payload: ProductCheckoutPayload) {
  if (payload.kind === "subscription") {
    return {
      item_id: `cardsnap_pro_${payload.plan}`,
      item_name: `CardSnap Pro ${payload.plan}`,
      value: payload.plan === "monthly" ? 9.99 : 99,
    };
  }
  return {
    item_id: `cardsnap_scan_pack_${payload.credits}`,
    item_name: `CardSnap ${payload.credits} scan pack`,
    value: PACK_VALUES[payload.credits],
  };
}

export function trackCheckoutStarted(
  payload: ProductCheckoutPayload,
  source: Ga4CheckoutSource,
  sessionId?: string
) {
  const gaParams = checkoutPayloadToGaParams(payload);
  trackGa4FunnelEvent("checkout_started", {
    source,
    ...gaParams,
  });
  trackBeginCheckout(checkoutItemForPayload(payload), sessionId);
}

const REPORT_CHECKOUT_VALUE = 4.99;

export function trackReportCheckoutStarted(
  source: Ga4CheckoutSource = "paywall",
  sessionId?: string
) {
  trackGa4FunnelEvent("checkout_started", {
    source,
    product_type: "report",
    value: REPORT_CHECKOUT_VALUE,
  });
  trackBeginCheckout(
    {
      value: REPORT_CHECKOUT_VALUE,
      item_id: "cardsnap_single_report",
      item_name: "CardSnap single grading report",
    },
    sessionId
  );
}

export function trackPaywallShown() {
  trackGa4FunnelEvent("paywall_shown", {
    page_path:
      typeof window !== "undefined" ? window.location.pathname : undefined,
  });
}

export function trackPricingPageView() {
  trackGa4FunnelEvent("pricing_page_view", { page_path: "/pricing" });
}

export function trackReportUpsellViewed() {
  trackGa4FunnelEvent("report_upsell_viewed");
}

export function trackReportUpsellClicked() {
  trackGa4FunnelEvent("report_upsell_clicked");
}

export function trackResultViewed(params: {
  scan_id: string;
  verdict: "grade" | "skip";
  is_pro: boolean;
}) {
  trackGa4FunnelEvent("result_viewed", params);
}

export function trackCheckoutCompleted(params: {
  transaction_id: string;
  value: number;
  product_type: "subscription" | "scan_pack" | "report";
  plan?: string;
  pack_credits?: number;
}) {
  trackGa4FunnelEvent("checkout_completed", {
    currency: "USD",
    ...params,
  });
}
