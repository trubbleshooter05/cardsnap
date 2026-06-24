import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Set is_pro for every user row tied to a Stripe customer from live subscription status. */
export async function reconcileProForStripeCustomer(
  stripe: Stripe,
  supabase: SupabaseClient,
  customerId: string
): Promise<boolean> {
  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 20,
  });
  const active = subs.data.some(
    (s) => s.status === "active" || s.status === "trialing"
  );

  const { error } = await supabase
    .from("users")
    .update({ is_pro: active })
    .eq("stripe_customer_id", customerId);

  if (error) {
    console.error("reconcileProForStripeCustomer failed", customerId, error);
    throw error;
  }

  return active;
}

export async function reconcileAllKnownStripeCustomers(
  stripe: Stripe,
  supabase: SupabaseClient
): Promise<number> {
  const { data: rows, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .not("stripe_customer_id", "is", null);

  if (error) throw error;

  const customerIds = Array.from(
    new Set(
      (rows ?? [])
        .map((r) => r.stripe_customer_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  for (const customerId of customerIds) {
    await reconcileProForStripeCustomer(stripe, supabase, customerId);
  }

  return customerIds.length;
}
