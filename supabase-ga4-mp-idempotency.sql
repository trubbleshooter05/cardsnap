-- GA4 Measurement Protocol idempotency index (run once in Supabase SQL Editor).
--
-- Adds a partial unique index on checkout_funnel_events scoped to rows where
-- event_name starts with 'ga4_mp_'. The webhook inserts a row with
-- event_name = 'ga4_mp_sent' before dispatching to GA4; ON CONFLICT DO NOTHING
-- prevents a second dispatch for the same Stripe session on webhook retries.
--
-- The partial scope means existing rows (fulfill_success, checkout_started, etc.)
-- are untouched and do not need to satisfy uniqueness.

CREATE UNIQUE INDEX IF NOT EXISTS checkout_funnel_events_ga4_mp_idempotency_idx
  ON public.checkout_funnel_events (event_name, checkout_session_id)
  WHERE event_name LIKE 'ga4_mp_%';
