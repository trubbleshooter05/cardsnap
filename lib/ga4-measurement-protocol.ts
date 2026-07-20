/**
 * Server-side GA4 Measurement Protocol sender.
 *
 * Ownership: this module is the ONLY place that fires purchase,
 * subscription_started, and checkout_completed to GA4. Client-side
 * ConversionTracker does NOT fire these events.
 *
 * Idempotency: before sending, inserts a row into checkout_funnel_events
 * with event_name = 'ga4_mp_sent'. A partial unique index on
 * (event_name, checkout_session_id) WHERE event_name LIKE 'ga4_mp_%'
 * causes a 23505 unique-violation on retries, preventing double-sends.
 * If the idempotency insert fails for any other reason, we fail closed
 * and do NOT send to GA4.
 *
 * Privacy: never sends email, name, or raw Stripe customer ID.
 * - client_id: taken from session.metadata.attr_ga_client_id (_ga cookie
 *   suffix captured client-side). Fallback: "server-<userId>" — prefixed
 *   so it is distinguishable in GA4 from browser hits.
 * - user_id: Supabase userId (pseudonymous UUID). Sent as the GA4 user_id
 *   field, not as an event parameter.
 * - ga_session_id: taken from session.metadata.attr_ga_session_id if present.
 *
 * Testing: swap MP_ENDPOINT to the debug URL to validate payloads without
 * recording events. See comment on MP_ENDPOINT below.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-DL4DHWG707";

// Live endpoint — records events in GA4.
// For payload validation only (does NOT record): use
// "https://www.google-analytics.com/debug/mp/collect"
// Live endpoint — records events in GA4.
// For payload validation only (does NOT record): use
// "https://www.google-analytics.com/debug/mp/collect"
const MP_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export type MpSendResult =
  | { sent: true }
  | {
      sent: false;
      reason:
        | "already_sent"
        | "idempotency_unavailable"
        | "ga4_error"
        | "not_configured";
    };

type FulfillmentKind = "subscription" | "pack" | "guest_report";

// ─── Payload builders ────────────────────────────────────────────────────────

function resolveClientId(
  session: Stripe.Checkout.Session,
  userId: string
): string {
  const fromMeta = session.metadata?.attr_ga_client_id;
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
  // Fallback: not PII, not a Stripe identifier, clearly distinguishable in GA4.
  return `server-${userId || session.id}`;
}

function resolveEventName(
  kind: FulfillmentKind
): "subscription_started" | "purchase" {
  return kind === "subscription" ? "subscription_started" : "purchase";
}

function resolveItemId(
  kind: FulfillmentKind,
  session: Stripe.Checkout.Session
): string {
  if (kind === "subscription") {
    const plan = session.metadata?.subscriptionPlan ?? "annual";
    return `cardsnap_pro_${plan}`;
  }
  if (kind === "pack") {
    const credits = session.metadata?.packCredits ?? "0";
    return `cardsnap_scan_pack_${credits}`;
  }
  return "cardsnap_single_report";
}

function resolveItemName(
  kind: FulfillmentKind,
  session: Stripe.Checkout.Session
): string {
  if (kind === "subscription") {
    const plan = session.metadata?.subscriptionPlan ?? "annual";
    return `CardSnap Pro ${plan}`;
  }
  if (kind === "pack") {
    const credits = session.metadata?.packCredits ?? "0";
    return `CardSnap ${credits} scan pack`;
  }
  return "CardSnap single grading report";
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Sends a GA4 purchase or subscription_started event via Measurement Protocol.
 * Must only be called after successful fulfillment (status === "fulfilled").
 *
 * @param supabase   - Server-side Supabase client (service role).
 * @param session    - The completed Stripe Checkout Session.
 * @param userId     - Supabase user ID (empty string for guest purchases).
 * @param kind       - The fulfillment kind from FulfillmentResult.
 */
export async function sendMeasurementProtocolPurchase(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  userId: string,
  kind: FulfillmentKind
): Promise<MpSendResult> {
  const apiSecret = process.env.GA_MP_API_SECRET;
  if (!apiSecret) {
    console.warn("[ga4-mp] GA_MP_API_SECRET not configured — skipping");
    return { sent: false, reason: "not_configured" };
  }

  // ── Idempotency gate ──────────────────────────────────────────────────────
  // The partial unique index on checkout_funnel_events ensures this insert
  // fails with 23505 if we already sent this event. We insert FIRST, send
  // to GA4 SECOND — "at-most-once" semantics. A GA4 network failure after a
  // successful insert will not be retried, which is preferable to double-counting.
  const { error: insertError } = await supabase
    .from("checkout_funnel_events")
    .insert({
      event_name: "ga4_mp_sent",
      checkout_session_id: session.id,
      user_id: userId || null,
      source: "webhook",
      payload: { kind, ga_measurement_id: GA_MEASUREMENT_ID },
    });

  if (insertError) {
    if (insertError.code === "23505") {
      console.log("[ga4-mp] already sent for session", session.id);
      return { sent: false, reason: "already_sent" };
    }
    // Any other DB error — fail closed. Do not send to GA4 without idempotency.
    console.error(
      "[ga4-mp] idempotency insert failed — GA4 send aborted",
      insertError.message
    );
    return { sent: false, reason: "idempotency_unavailable" };
  }

  // ── Build payload ─────────────────────────────────────────────────────────
  const value = (session.amount_total ?? 0) / 100;
  const clientId = resolveClientId(session, userId);
  const eventName = resolveEventName(kind);
  const gaSessionId = session.metadata?.attr_ga_session_id;
  const currency = (session.currency ?? "usd").toUpperCase();

  const mpPayload = {
    client_id: clientId,
    // user_id is GA4's user-scoped identifier — pseudonymous, not PII.
    ...(userId ? { user_id: userId } : {}),
    non_personalized_ads: false,
    events: [
      {
        name: eventName,
        params: {
          currency,
          transaction_id: session.id,
          value,
          source: "webhook",
          // session_id scopes the hit to the correct GA4 session for attribution.
          ...(gaSessionId ? { session_id: gaSessionId } : {}),
          items: [
            {
              item_id: resolveItemId(kind, session),
              item_name: resolveItemName(kind, session),
              quantity: 1,
              price: value,
            },
          ],
        },
      },
    ],
  };

  // ── Dispatch ──────────────────────────────────────────────────────────────
  try {
    const res = await fetch(
      `${MP_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${apiSecret}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mpPayload),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[ga4-mp] GA4 non-2xx response", {
        status: res.status,
        body,
        session: session.id,
      });
      return { sent: false, reason: "ga4_error" };
    }

    console.log("[ga4-mp] sent successfully", {
      event: eventName,
      session: session.id,
      value,
      clientId,
    });
    return { sent: true };
  } catch (err) {
    console.error("[ga4-mp] network error during dispatch", err);
    return { sent: false, reason: "ga4_error" };
  }
}
