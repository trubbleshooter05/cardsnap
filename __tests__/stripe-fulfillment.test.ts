import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import {
  fulfillCheckoutSession,
  fulfillGuestReportCheckout,
} from "../lib/stripe-fulfillment";

// ── Minimal Supabase mock ─────────────────────────────────────────────────────

function makeMockSupabase(overrides: {
  fulfillments?: { data: unknown; error: null } | { data: null; error: { code?: string; message: string } };
  guestPurchases?: { data: unknown; error: null } | { data: null; error: { message: string } };
  users?: { data: unknown; error: null } | { data: null; error: { message: string } };
  insertError?: { message: string; code?: string } | null;
  guestInsertError?: { message: string } | null;
} = {}): SupabaseClient {
  const {
    fulfillments = { data: null, error: null },
    guestPurchases = { data: null, error: null },
    users = { data: null, error: null },
    insertError = null,
    guestInsertError = null,
  } = overrides;

  const fromImpl = (table: string) => ({
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve(
            table === "stripe_checkout_fulfillments"
              ? fulfillments
              : table === "guest_report_purchases"
              ? guestPurchases
              : users
          ),
      }),
    }),
    insert: () =>
      Promise.resolve(
        table === "guest_report_purchases"
          ? { error: guestInsertError }
          : { error: insertError }
      ),
    upsert: () => Promise.resolve({ error: null }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
  });

  return { from: fromImpl } as unknown as SupabaseClient;
}

// ── Session factory ───────────────────────────────────────────────────────────

function makeSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test_123",
    mode: "subscription",
    status: "complete",
    payment_status: "paid",
    customer: "cus_test",
    customer_email: null,
    customer_details: null,
    amount_total: null,
    currency: "usd",
    metadata: { userId: "user_abc" },
    client_reference_id: null,
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

// ── Tests: fulfillCheckoutSession (authenticated) ─────────────────────────────

describe("fulfillCheckoutSession", () => {
  it("fulfills a subscription for an authenticated user", async () => {
    const supabase = makeMockSupabase();
    const session = makeSession({ mode: "subscription", metadata: { userId: "user_abc" } });
    const result = await fulfillCheckoutSession(supabase, session);
    expect(result.status).toBe("fulfilled");
    expect(result).toMatchObject({ kind: "subscription" });
  });

  it("returns already_fulfilled if session was already recorded", async () => {
    const supabase = makeMockSupabase({
      fulfillments: { data: { fulfillment_type: "subscription" }, error: null },
    });
    const session = makeSession({ mode: "subscription", metadata: { userId: "user_abc" } });
    const result = await fulfillCheckoutSession(supabase, session);
    expect(result.status).toBe("already_fulfilled");
  });

  it("fulfills a scan pack for an authenticated user", async () => {
    const supabase = makeMockSupabase({
      users: { data: { scan_credits: 0 }, error: null },
    });
    const session = makeSession({
      mode: "payment",
      metadata: { userId: "user_abc", packCredits: "10" },
    });
    const result = await fulfillCheckoutSession(supabase, session);
    expect(result.status).toBe("fulfilled");
    expect(result).toMatchObject({ kind: "pack", packCredits: 10 });
  });

  it("throws loudly when userId is missing on a non-guest session", async () => {
    const supabase = makeMockSupabase();
    const session = makeSession({
      mode: "subscription",
      metadata: {},
      client_reference_id: null,
    });
    await expect(fulfillCheckoutSession(supabase, session)).rejects.toThrow(/missing userId/);
  });

  it("skips when payment_status is not paid", async () => {
    const supabase = makeMockSupabase();
    const session = makeSession({
      payment_status: "unpaid",
      status: "open",
      metadata: { userId: "user_abc" },
    });
    const result = await fulfillCheckoutSession(supabase, session);
    expect(result.status).toBe("skipped");
    expect((result as { reason: string }).reason).toBe("not_paid");
  });
});

// ── Tests: fulfillGuestReportCheckout ─────────────────────────────────────────

describe("fulfillGuestReportCheckout", () => {
  it("fulfills a guest single_report checkout", async () => {
    const supabase = makeMockSupabase();
    const session = makeSession({
      mode: "payment",
      metadata: { source: "single_report", scanId: "scan_xyz" },
      customer_email: "sarah@example.com",
      amount_total: 499,
    });
    const result = await fulfillGuestReportCheckout(supabase, session);
    expect(result.status).toBe("fulfilled");
    expect(result).toMatchObject({ kind: "guest_report" });
  });

  it("returns already_fulfilled for duplicate webhook delivery", async () => {
    const supabase = makeMockSupabase({
      guestPurchases: { data: { checkout_session_id: "cs_test_123" }, error: null },
    });
    const session = makeSession({
      mode: "payment",
      metadata: { source: "single_report", scanId: "scan_xyz" },
      customer_email: "sarah@example.com",
    });
    const result = await fulfillGuestReportCheckout(supabase, session);
    expect(result.status).toBe("already_fulfilled");
  });

  it("throws loudly on DB insert failure", async () => {
    const supabase = makeMockSupabase({
      guestInsertError: { message: "connection error" },
    });
    const session = makeSession({
      mode: "payment",
      metadata: { source: "single_report", scanId: "scan_xyz" },
      customer_email: "sarah@example.com",
    });
    await expect(fulfillGuestReportCheckout(supabase, session)).rejects.toMatchObject({
      message: "connection error",
    });
  });
});
