import type { SupabaseClient } from "@supabase/supabase-js";

export type CheckoutFunnelEvent =
  | "checkout_started"
  | "fulfill_success"
  | "fulfill_failed"
  | "fulfill_skipped"
  | "refund_revoked";

type LogPayload = Record<string, string | number | boolean | null | undefined>;

/** Server-side funnel log — query in Supabase SQL editor. */
export async function logCheckoutFunnelEvent(
  supabase: SupabaseClient,
  event: CheckoutFunnelEvent,
  params: {
    userId?: string | null;
    checkoutSessionId?: string | null;
    source?: string;
    payload?: LogPayload;
  }
): Promise<void> {
  const row = {
    event_name: event,
    user_id: params.userId ?? null,
    checkout_session_id: params.checkoutSessionId ?? null,
    source: params.source ?? null,
    payload: params.payload ?? {},
  };

  console.log("[cardsnap:checkout-funnel]", row);

  const { error } = await supabase.from("checkout_funnel_events").insert(row);
  if (error) {
    console.warn("[cardsnap:checkout-funnel] db insert skipped:", error.message);
  }
}
