import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SCAN_PACK_CREDITS,
  type ScanPackCredits,
} from "@/lib/stripe-scan-packs";

export type FulfillmentResult =
  | { status: "fulfilled"; kind: "subscription" | "pack"; packCredits?: number }
  | { status: "already_fulfilled"; kind: "subscription" | "pack" }
  | { status: "skipped"; reason: string };

function sessionUserId(session: Stripe.Checkout.Session): string | null {
  const fromMeta = session.metadata?.userId;
  if (typeof fromMeta === "string" && fromMeta.length > 0) return fromMeta;
  if (typeof session.client_reference_id === "string") {
    return session.client_reference_id;
  }
  return null;
}

async function isSessionFulfilled(
  supabase: SupabaseClient,
  sessionId: string
): Promise<{ fulfilled: boolean; kind?: string }> {
  const { data, error } = await supabase
    .from("stripe_checkout_fulfillments")
    .select("fulfillment_type")
    .eq("checkout_session_id", sessionId)
    .maybeSingle();

  if (error) {
    // Table missing or transient — treat as not fulfilled but log.
    console.warn("stripe fulfillment lookup failed", error.message);
    return { fulfilled: false };
  }

  if (!data) return { fulfilled: false };
  return { fulfilled: true, kind: data.fulfillment_type };
}

async function markSessionFulfilled(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  kind: "subscription" | "pack",
  packCredits?: number
): Promise<void> {
  const userId = sessionUserId(session);
  if (!userId) return;

  const { error } = await supabase.from("stripe_checkout_fulfillments").insert({
    checkout_session_id: session.id,
    user_id: userId,
    fulfillment_type: kind,
    pack_credits: packCredits ?? null,
  });

  if (error && error.code !== "23505") {
    console.error("stripe fulfillment insert failed", error);
    throw error;
  }
}

export async function fulfillCheckoutSession(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session
): Promise<FulfillmentResult> {
  const userId = sessionUserId(session);
  if (!userId) {
    return { status: "skipped", reason: "missing_user_id" };
  }

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return { status: "skipped", reason: "not_paid" };
  }

  const prior = await isSessionFulfilled(supabase, session.id);
  if (prior.fulfilled) {
    return {
      status: "already_fulfilled",
      kind: prior.kind === "pack" ? "pack" : "subscription",
    };
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  if (session.mode === "subscription") {
    const { error: upErr } = await supabase.from("users").upsert(
      {
        id: userId,
        is_pro: true,
        stripe_customer_id: customerId,
      },
      { onConflict: "id" }
    );
    if (upErr) {
      console.error("subscription fulfillment upsert failed", upErr);
      throw upErr;
    }
    await markSessionFulfilled(supabase, session, "subscription");
    return { status: "fulfilled", kind: "subscription" };
  }

  if (session.mode === "payment") {
    const raw = session.metadata?.packCredits;
    const creditsToAdd = Number.parseInt(String(raw ?? "0"), 10);
    const validPack = SCAN_PACK_CREDITS.includes(creditsToAdd as ScanPackCredits);
    if (!validPack) {
      return { status: "skipped", reason: "invalid_pack_credits" };
    }

    const { data: prev } = await supabase
      .from("users")
      .select("scan_credits")
      .eq("id", userId)
      .maybeSingle();
    const nextCredits = Number(prev?.scan_credits ?? 0) + creditsToAdd;

    if (prev) {
      const { error: upErr } = await supabase
        .from("users")
        .update({ scan_credits: nextCredits, stripe_customer_id: customerId })
        .eq("id", userId);
      if (upErr) {
        console.error("pack fulfillment update failed", upErr);
        throw upErr;
      }
    } else {
      const { error: insErr } = await supabase.from("users").insert({
        id: userId,
        is_pro: false,
        stripe_customer_id: customerId,
        scan_credits: creditsToAdd,
      });
      if (insErr) {
        console.error("pack fulfillment insert failed", insErr);
        throw insErr;
      }
    }

    await markSessionFulfilled(supabase, session, "pack", creditsToAdd);
    return { status: "fulfilled", kind: "pack", packCredits: creditsToAdd };
  }

  return { status: "skipped", reason: "unsupported_mode" };
}
