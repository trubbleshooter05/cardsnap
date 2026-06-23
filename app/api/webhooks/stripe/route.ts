import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { fulfillCheckoutSession } from "@/lib/stripe-fulfillment";
import { logCheckoutFunnelEvent } from "@/lib/checkout-funnel-log";

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
          const result = await fulfillCheckoutSession(supabase, session);
          const event =
            result.status === "fulfilled" || result.status === "already_fulfilled"
              ? "fulfill_success"
              : "fulfill_skipped";
          void logCheckoutFunnelEvent(supabase, event, {
            userId: session.metadata?.userId ?? session.client_reference_id,
            checkoutSessionId: session.id,
            source: "webhook",
            payload: { result: result.status, reason: "reason" in result ? result.reason : null },
          });
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
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        let userId = sub.metadata?.userId as string | undefined;
        if (!userId && typeof sub.customer === "string") {
          const { data: linkRow } = await supabase
            .from("users")
            .select("id")
            .eq("stripe_customer_id", sub.customer)
            .maybeSingle();
          userId = linkRow?.id;
        }
        if (!userId) break;
        const active =
          sub.status === "active" || sub.status === "trialing";
        await supabase
          .from("users")
          .update({ is_pro: active })
          .eq("id", userId);
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
