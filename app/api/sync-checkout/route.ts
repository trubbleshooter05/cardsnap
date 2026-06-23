import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createServerSupabase } from "@/lib/supabase";
import { fulfillCheckoutSession } from "@/lib/stripe-fulfillment";
import { logCheckoutFunnelEvent } from "@/lib/checkout-funnel-log";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  checkoutSessionId: z.string().min(1),
});

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
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

  const stripe = new Stripe(secret);
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(parsed.data.checkoutSessionId);
  } catch (e) {
    console.error("sync-checkout retrieve failed", e);
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const sessionUserId =
    session.metadata?.userId ??
    (typeof session.client_reference_id === "string"
      ? session.client_reference_id
      : null);

  if (sessionUserId !== user.id) {
    return NextResponse.json({ error: "session_user_mismatch" }, { status: 403 });
  }

  try {
    const result = await fulfillCheckoutSession(supabase, session);
    const event =
      result.status === "fulfilled"
        ? "fulfill_success"
        : result.status === "already_fulfilled"
          ? "fulfill_success"
          : "fulfill_skipped";
    void logCheckoutFunnelEvent(supabase, event, {
      userId: user.id,
      checkoutSessionId: session.id,
      source: "sync-checkout",
      payload: { result: result.status, reason: "reason" in result ? result.reason : null },
    });
    return NextResponse.json({ synced: true, ...result });
  } catch (e) {
    console.error("sync-checkout fulfill failed", e);
    void logCheckoutFunnelEvent(supabase, "fulfill_failed", {
      userId: user.id,
      checkoutSessionId: session.id,
      source: "sync-checkout",
      payload: { error: e instanceof Error ? e.message : "unknown" },
    });
    return NextResponse.json({ error: "fulfill_failed" }, { status: 500 });
  }
}
