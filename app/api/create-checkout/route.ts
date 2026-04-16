import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

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

  const supabase = createServerSupabase();

  // Get the authenticated user from the request
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user?.id) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const userId = user.id;
  const stripe = new Stripe(secret);

  // Get or create Stripe customer
  const { data: existing } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
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

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?upgraded=1`,
    cancel_url: `${appUrl}/?canceled=1`,
    client_reference_id: userId,
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
