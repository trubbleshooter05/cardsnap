import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reconcileProForStripeCustomer } from "@/lib/stripe-pro-reconcile";

async function findCheckoutSessionForCharge(
  stripe: Stripe,
  charge: Stripe.Charge
): Promise<Stripe.Checkout.Session | null> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id ?? null;

  if (!paymentIntentId) return null;

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });
  return sessions.data[0] ?? null;
}

export async function revokeCheckoutSession(
  stripe: Stripe,
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<{ revoked: boolean; kind?: string; reason?: string }> {
  const sessionId = session.id;
  const { data: fulfillment, error } = await supabase
    .from("stripe_checkout_fulfillments")
    .select("checkout_session_id, user_id, fulfillment_type, pack_credits, revoked_at")
    .eq("checkout_session_id", sessionId)
    .maybeSingle();

  if (error) throw error;
  if (!fulfillment) return { revoked: false, reason: "no_fulfillment_record" };
  if (fulfillment.revoked_at) {
    return { revoked: false, reason: "already_revoked", kind: fulfillment.fulfillment_type };
  }

  const userId = fulfillment.user_id;

  if (fulfillment.fulfillment_type === "pack") {
    const granted = Number(fulfillment.pack_credits ?? 0);
    const { data: userRow } = await supabase
      .from("users")
      .select("scan_credits")
      .eq("id", userId)
      .maybeSingle();
    const next = Math.max(0, Number(userRow?.scan_credits ?? 0) - granted);
    const { error: upErr } = await supabase
      .from("users")
      .update({ scan_credits: next })
      .eq("id", userId);
    if (upErr) throw upErr;
  }

  if (fulfillment.fulfillment_type === "subscription") {
    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
    if (subId) {
      try {
        await stripe.subscriptions.cancel(subId);
      } catch (e) {
        console.warn("revoke: subscription cancel failed", e);
      }
    }
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id ?? null;
    if (customerId) {
      await reconcileProForStripeCustomer(stripe, supabase, customerId);
    } else {
      await supabase.from("users").update({ is_pro: false }).eq("id", userId);
    }
  }

  await supabase
    .from("stripe_checkout_fulfillments")
    .update({ revoked_at: new Date().toISOString() })
    .eq("checkout_session_id", sessionId);

  return { revoked: true, kind: fulfillment.fulfillment_type };
}

export async function handleChargeRefunded(
  stripe: Stripe,
  supabase: SupabaseClient,
  charge: Stripe.Charge
): Promise<{ handled: boolean; reason?: string; kind?: string }> {
  if (!charge.refunded) {
    return { handled: false, reason: "not_fully_refunded" };
  }

  const session = await findCheckoutSessionForCharge(stripe, charge);
  if (!session) {
    const customerId =
      typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
    if (customerId) {
      await reconcileProForStripeCustomer(stripe, supabase, customerId);
      return { handled: true, reason: "reconciled_customer_only" };
    }
    return { handled: false, reason: "no_checkout_session" };
  }

  const result = await revokeCheckoutSession(stripe, supabase, session);
  return { handled: result.revoked, reason: result.reason, kind: result.kind };
}
