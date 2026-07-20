import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { fulfillCheckoutSession, fulfillGuestReportCheckout } from "@/lib/stripe-fulfillment";
import { logCheckoutFunnelEvent } from "@/lib/checkout-funnel-log";
import { reconcileProForStripeCustomer } from "@/lib/stripe-pro-reconcile";
import { handleChargeRefunded } from "@/lib/stripe-revoke";
import { sendMeasurementProtocolPurchase } from "@/lib/ga4-measurement-protocol";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !whSecret) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const stripe = new Stripe(secret);
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "no_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (e) {
    console.error("Stripe webhook signature error", e);
    return NextResponse.json({ error: "bad_signature" }, { status: 400 });
  }

  const supabase = createServerSupabase();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        try {
          const isGuestReport = session.metadata?.source === "single_report";
          const result = isGuestReport
            ? await fulfillGuestReportCheckout(supabase, session)
            : await fulfillCheckoutSession(supabase, session);

          const funnelEvent =
            result.status === "fulfilled" || result.status === "already_fulfilled"
              ? "fulfill_success"
              : "fulfill_skipped";
          void logCheckoutFunnelEvent(supabase, funnelEvent, {
            userId: session.metadata?.userId ?? session.client_reference_id,
            checkoutSessionId: session.id,
            source: "webhook",
            payload: { result: result.status, reason: "reason" in result ? result.reason : null },
          });

          // GA4 Measurement Protocol — fires only on fresh fulfillment.
          // already_fulfilled means this is a Stripe webhook retry for a session
          // that was already processed; the idempotency index would also block a
          // second send, but we skip the attempt entirely for clarity.
          if (result.status === "fulfilled") {
            const userId =
              session.metadata?.userId ?? session.client_reference_id ?? "";
            try {
              const mpResult = await sendMeasurementProtocolPurchase(
                supabase,
                session,
                userId,
                result.kind
              );
              if (!mpResult.sent) {
                console.log("[ga4-mp] not sent", {
                  reason: mpResult.reason,
                  session: session.id,
                });
              }
            } catch (mpErr) {
              // Never let a GA4 failure cause Stripe to retry the webhook.
              console.error("[ga4-mp] unexpected error — suppressed", mpErr);
            }
          }
        } catch (e) {
          void logCheckoutFunnelEvent(supabase, "fulfill_failed", {
            userId: session.metadata?.userId ?? session.client_reference_id,
            checkoutSessionId: session.id,
            source: "webhook",
            payload: { error: e instanceof Error ? e.message : "unknown" },
          });
          throw e;
        }
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        try {
          const result = await handleChargeRefunded(stripe, supabase, charge);
          void logCheckoutFunnelEvent(supabase, "refund_revoked", {
            userId: typeof charge.customer === "string" ? charge.customer : charge.customer?.id,
            source: "webhook",
            payload: result,
          });
        } catch (e) {
          console.error("charge.refunded handler failed", e);
          throw e;
        }
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string"
            ? sub.customer
            : sub.customer?.id ?? null;
        if (customerId) {
          await reconcileProForStripeCustomer(stripe, supabase, customerId);
        }

        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Webhook handler error", e);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
