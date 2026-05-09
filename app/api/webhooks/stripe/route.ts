import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  SCAN_PACK_CREDITS,
  type ScanPackCredits,
} from "@/lib/stripe-scan-packs";
import { createServerSupabase } from "@/lib/supabase";

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
        const userId =
          session.metadata?.userId ??
          (typeof session.client_reference_id === "string"
            ? session.client_reference_id
            : undefined);
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;

        if (!userId) break;

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
            console.error("checkout.session.completed upsert failed", upErr);
            throw upErr;
          }
        } else if (session.mode === "payment" && session.payment_status === "paid") {
          const raw = session.metadata?.packCredits;
          const creditsToAdd = Number.parseInt(String(raw ?? "0"), 10);
          const validPack = SCAN_PACK_CREDITS.includes(
            creditsToAdd as ScanPackCredits
          );
          if (!validPack) break;

          const { data: prev } = await supabase
            .from("users")
            .select("scan_credits")
            .eq("id", userId)
            .maybeSingle();
          const nextCredits =
            Number(prev?.scan_credits ?? 0) + creditsToAdd;

          if (prev) {
            const { error: upErr } = await supabase
              .from("users")
              .update({ scan_credits: nextCredits })
              .eq("id", userId);
            if (upErr) {
              console.error("pack credits update failed", upErr);
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
              console.error("pack credits insert failed", insErr);
              throw insErr;
            }
          }
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
