-- CardSnap: enable RLS on all public tables (fixes Supabase "rls_disabled_in_public").
-- Run once in Supabase → SQL Editor for project sfcxqbwpctjonecgicpp.
-- Server routes use SUPABASE_SERVICE_ROLE_KEY and bypass RLS.

-- ── scans ────────────────────────────────────────────────────────────────────
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can insert their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;

CREATE POLICY "Users can view their own scans"
  ON public.scans FOR SELECT
  USING ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can insert their own scans"
  ON public.scans FOR INSERT
  WITH CHECK ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can update their own scans"
  ON public.scans FOR UPDATE
  USING ((auth.uid())::text = (user_id)::text)
  WITH CHECK ((auth.uid())::text = (user_id)::text);

CREATE POLICY "Users can delete their own scans"
  ON public.scans FOR DELETE
  USING ((auth.uid())::text = (user_id)::text);

-- ── users ────────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own user record" ON public.users;
DROP POLICY IF EXISTS "Users can update their own user record" ON public.users;
DROP POLICY IF EXISTS "Service role can insert user records" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user record" ON public.users;

CREATE POLICY "Users can view their own user record"
  ON public.users FOR SELECT
  USING ((auth.uid())::text = (id)::text);

CREATE POLICY "Users can update their own user record"
  ON public.users FOR UPDATE
  USING ((auth.uid())::text = (id)::text)
  WITH CHECK ((auth.uid())::text = (id)::text);

CREATE POLICY "Users can insert their own user record"
  ON public.users FOR INSERT
  WITH CHECK ((auth.uid())::text = (id)::text);

-- ── server-only tables (RLS on, no anon/authenticated policies) ─────────────
ALTER TABLE IF EXISTS public.free_scan_ip_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_fingerprint_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.device_fingerprint_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.checkout_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stripe_checkout_fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.guest_report_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.email_leads ENABLE ROW LEVEL SECURITY;

-- Verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
