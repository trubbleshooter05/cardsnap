import type { ProductCheckoutPayload } from "@/lib/product-checkout-client";

export type Ga4FunnelEvent =
  | "paywall_shown"
  | "upgrade_clicked"
  | "checkout_started"
  | "checkout_completed"
  | "pricing_page_view"
  | "result_viewed";

export type Ga4CheckoutSource =
  | "paywall"
  | "result_cta"
  | "pricing"
  | "account"
  | "post_login";

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

export function trackGa4FunnelEvent(
  eventName: Ga4FunnelEvent,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", eventName, stripUndefined(params ?? {}));
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

export function trackCheckoutStarted(
  payload: ProductCheckoutPayload,
  source: Ga4CheckoutSource
) {
  trackGa4FunnelEvent("checkout_started", {
    source,
    ...checkoutPayloadToGaParams(payload),
  });
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
