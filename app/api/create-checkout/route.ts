import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  userId: z.string().uuid(),
});

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!secret || !priceId) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 500 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { userId } = parsed.data;
  const stripe = new Stripe(secret);
  const supabase = createServerSupabase();

  const { data: existing } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
    });
    customerId = customer.id;
    await supabase.from("users").upsert(
      {
        id: userId,
        stripe_customer_id: customerId,
        is_pro: false,
      },
      { onConflict: "id" }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?upgraded=1`,
    cancel_url: `${appUrl}/?canceled=1`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "no_session_url" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
