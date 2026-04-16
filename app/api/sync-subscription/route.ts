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

  // If no Stripe customer linked to this auth.uid, look up by email.
  // This restores subscriptions paid under an anonymous UUID before auth was added.
  if (!customerId && user.email) {
    try {
      // Use list (more reliable than search across all SDK versions)
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log(`sync-subscription: found Stripe customer ${customerId} by email ${user.email}`);
      } else {
        console.log(`sync-subscription: no Stripe customer found for email ${user.email}`);
      }
    } catch (e) {
      console.error("sync-subscription email lookup failed", e);
    }
  }

  if (!customerId) {
    return NextResponse.json({ synced: true, isPro: false, hasStripeCustomer: false });
  }

  // Check subscription status
  let isPro = false;
  try {
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });
    isPro = subs.data.some((s) => s.status === "active" || s.status === "trialing");
    console.log(`sync-subscription: customer ${customerId} isPro=${isPro} (${subs.data.length} subs)`);
  } catch (e) {
    console.error("sync-subscription stripe list failed", e);
    return NextResponse.json({ error: "stripe_list_failed" }, { status: 502 });
  }

  // Single upsert with final is_pro value — avoids the two-step race
  const { error: upsertErr } = await supabase
    .from("users")
    .upsert(
      { id: userId, stripe_customer_id: customerId, is_pro: isPro },
      { onConflict: "id" }
    );

  if (upsertErr) {
    console.error("sync-subscription upsert failed", upsertErr);
    return NextResponse.json({ error: "user_update_failed", detail: upsertErr.message }, { status: 500 });
  }

  console.log(`sync-subscription: upserted userId=${userId} is_pro=${isPro}`);
  return NextResponse.json({ synced: true, isPro, hasStripeCustomer: true });
}
