import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { reconcileProForStripeCustomer } from "@/lib/stripe-pro-reconcile";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }

  const supabase = createServerSupabase();
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

  const { data: row, error: fetchErr } = await supabase
    .from("users")
    .select("id, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr) {
    return NextResponse.json({ error: "user_fetch_failed" }, { status: 500 });
  }

  let customerId = row?.stripe_customer_id ?? null;
  if (!customerId && user.email) {
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    } catch (e) {
      console.error("sync-subscription email lookup failed", e);
    }
  }

  if (!customerId) {
    await supabase.from("users").upsert({ id: userId, is_pro: false }, { onConflict: "id" });
    return NextResponse.json({ synced: true, isPro: false, hasStripeCustomer: false });
  }

  let isPro = false;
  try {
    isPro = await reconcileProForStripeCustomer(stripe, supabase, customerId);
  } catch {
    return NextResponse.json({ error: "stripe_reconcile_failed" }, { status: 502 });
  }

  await supabase
    .from("users")
    .upsert({ id: userId, stripe_customer_id: customerId, is_pro: isPro }, { onConflict: "id" });

  return NextResponse.json({ synced: true, isPro, hasStripeCustomer: true });
}
