import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { CARDSNAP_USER_COOKIE, isValidUserId } from "@/lib/cardsnap-user-id";

export const dynamic = "force-dynamic";

export async function POST() {
  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!secret) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 500 }
    );
  }

  const rawId = cookies().get(CARDSNAP_USER_COOKIE)?.value;
  if (!isValidUserId(rawId)) {
    return NextResponse.json({ error: "invalid_user_id" }, { status: 401 });
  }

  const supabase = createServerSupabase();
  const { data: row, error } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", rawId)
    .maybeSingle();

  if (error) {
    console.error("portal user fetch", error);
    return NextResponse.json({ error: "user_fetch_failed" }, { status: 500 });
  }

  const customerId = row?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json(
      { error: "no_stripe_customer" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(secret);
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/account`,
    });
    if (!session.url) {
      return NextResponse.json(
        { error: "no_portal_url" },
        { status: 500 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("billing portal create", e);
    return NextResponse.json(
      { error: "portal_unavailable" },
      { status: 502 }
    );
  }
}
