import { NextResponse } from "next/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!secret) {
    return NextResponse.json(
      { error: "stripe_not_configured" },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    scanId?: string;
  };

  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email:
      body.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)
        ? body.email.toLowerCase().trim()
        : undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "CardSnap single grading report",
            description: "One unlocked sports-card grading ROI report.",
          },
          unit_amount: 499,
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/?report=success`,
    cancel_url: `${appUrl}/?report=cancelled`,
    metadata: {
      scanId: body.scanId ?? "",
      source: "single_report",
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "no_session_url" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
