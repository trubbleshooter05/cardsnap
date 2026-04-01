import { NextResponse } from "next/server";
import Stripe from "stripe";
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
        const userId = session.metadata?.userId;
        if (userId && session.mode === "subscription") {
          await supabase.from("users").upsert(
            {
              id: userId,
              is_pro: true,
              stripe_customer_id:
                typeof session.customer === "string"
                  ? session.customer
                  : session.customer?.id ?? null,
            },
            { onConflict: "id" }
          );
        }
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
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
