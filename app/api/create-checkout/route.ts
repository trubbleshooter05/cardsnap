import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import {
  type ScanPackCredits,
  scanPackPriceIdFromEnv,
} from "@/lib/stripe-scan-packs";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    subscriptionPlan: z.enum(["annual", "monthly"]).optional(),
    packCredits: z.union([z.literal(10), z.literal(50), z.literal(200)]).optional(),
  })
  .refine(
    (d) => !(d.packCredits != null && d.subscriptionPlan != null),
    { message: "subscription_and_pack_exclusive" }
  );

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!secret) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 500 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { subscriptionPlan, packCredits } = parsed.data;
  const isPack = packCredits != null;

  const monthlyPriceId = process.env.STRIPE_PRICE_ID;
  const annualPriceId =
    process.env.STRIPE_PRICE_ID_ANNUAL ?? process.env.STRIPE_PRICE_YEARLY;

  if (isPack) {
    const packPriceId = scanPackPriceIdFromEnv(
      packCredits as ScanPackCredits,
      process.env
    );
    if (!packPriceId) {
      return NextResponse.json(
        { error: "stripe_pack_price_not_configured" },
        { status: 500 }
      );
    }
  } else {
    const plan = subscriptionPlan ?? "annual";
    const priceId = plan === "annual" ? annualPriceId : monthlyPriceId;
    if (!priceId) {
      return NextResponse.json(
        {
          error: "stripe_price_not_configured",
          detail:
            plan === "annual"
              ? "Set STRIPE_PRICE_ID_ANNUAL for the annual plan."
              : "Set STRIPE_PRICE_ID for the monthly plan.",
        },
        { status: 500 }
      );
    }
  }

  const supabase = createServerSupabase();

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user?.id) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  const userId = user.id;
  const stripe = new Stripe(secret);

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

  if (isPack) {
    const packPriceId = scanPackPriceIdFromEnv(
      packCredits as ScanPackCredits,
      process.env
    )!;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [{ price: packPriceId, quantity: 1 }],
      success_url: `${appUrl}/?pack_purchase=1`,
      cancel_url: `${appUrl}/?canceled=1`,
      client_reference_id: userId,
      metadata: {
        userId,
        packCredits: String(packCredits),
      },
      payment_intent_data: {
        metadata: {
          userId,
          packCredits: String(packCredits),
        },
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: "no_session_url" }, { status: 500 });
    }
    return NextResponse.json({ url: session.url });
  }

  const subPlan = subscriptionPlan ?? "annual";
  const subPriceId =
    subPlan === "annual"
      ? (annualPriceId as string)
      : (monthlyPriceId as string);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: subPriceId, quantity: 1 }],
    success_url: `${appUrl}/?upgraded=1`,
    cancel_url: `${appUrl}/?canceled=1`,
    client_reference_id: userId,
    metadata: { userId, subscriptionPlan: subPlan },
    subscription_data: {
      metadata: { userId, subscriptionPlan: subPlan },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "no_session_url" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
