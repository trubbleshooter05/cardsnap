import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/**
 * Reads Stripe subscription status for authenticated user and updates `users.is_pro`.
 * Use after checkout return or for "Restore access".
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 500 }
    );
  }

  const supabase = createServerSupabase();

  // Get authenticated user from Authorization header
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

  const { data: row, error: fetchErr } = await supabase
    .from("users")
    .select("id, stripe_customer_id, is_pro")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr) {
    console.error("sync-subscription fetch user", fetchErr);
    return NextResponse.json(
      { error: "user_fetch_failed" },
      { status: 500 }
    );
  }

  const stripe = new Stripe(secret);
  let customerId = row?.stripe_customer_id ?? null;

  // If no Stripe customer linked to this auth.uid, try looking up by email
  // This covers users who paid under an anonymous UUID before creating an account
  if (!customerId && user.email) {
    try {
      const customers = await stripe.customers.search({
        query: `email:"${user.email}"`,
        limit: 5,
      });
      if (customers.data.length > 0) {
        // Use the first customer found with this email
        customerId = customers.data[0].id;
        // Link this Stripe customer to the auth user in our database
        await supabase.from("users").upsert(
          { id: userId, stripe_customer_id: customerId, is_pro: false },
          { onConflict: "id" }
        );
      }
    } catch (e) {
      console.error("sync-subscription email lookup", e);
    }
  }

  if (!customerId) {
    return NextResponse.json({ synced: true, isPro: false, hasStripeCustomer: false });
  }

  let isPro = false;
  try {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    isPro = list.data.some(
      (s) => s.status === "active" || s.status === "trialing"
    );
  } catch (e) {
    console.error("sync-subscription stripe list", e);
    return NextResponse.json({ error: "stripe_list_failed" }, { status: 502 });
  }

  const { error: updErr } = await supabase
    .from("users")
    .update({ is_pro: isPro, stripe_customer_id: customerId })
    .eq("id", userId);

  if (updErr) {
    console.error("sync-subscription update user", updErr);
    return NextResponse.json({ error: "user_update_failed" }, { status: 500 });
  }

  return NextResponse.json({ synced: true, isPro, hasStripeCustomer: true });
}
