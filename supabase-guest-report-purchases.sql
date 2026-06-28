-- Guest report purchases: fulfilled without a logged-in userId.
-- Keyed by checkout_session_id for idempotency.
-- Run once in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.guest_report_purchases (
  checkout_session_id text PRIMARY KEY,
  customer_email      text,
  scan_id             text,
  amount_total        integer NOT NULL DEFAULT 0,
  currency            text NOT NULL DEFAULT 'usd',
  payment_status      text,
  fulfilled_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS guest_report_purchases_email_idx
  ON public.guest_report_purchases (customer_email);

CREATE INDEX IF NOT EXISTS guest_report_purchases_scan_id_idx
  ON public.guest_report_purchases (scan_id);

-- ── Backfill: Sarah Robbins ───────────────────────────────────────────────────
-- Her payment succeeded but webhook silently skipped (missing_user_id).
-- Steps:
--   1. Go to Stripe Dashboard → Payments → find Sarah Robbins' payment
--   2. Click into the payment → find the Checkout Session ID (cs_live_...)
--   3. Note the scanId from Session metadata
--   4. Replace the placeholders below and run this INSERT

-- INSERT INTO public.guest_report_purchases
--   (checkout_session_id, customer_email, scan_id, amount_total, currency, payment_status, fulfilled_at)
-- VALUES
--   ('cs_live_REPLACE_ME', 'sarah.robbins@REPLACE.com', 'SCAN_ID_FROM_METADATA', 499, 'usd', 'paid', now())
-- ON CONFLICT (checkout_session_id) DO NOTHING;
