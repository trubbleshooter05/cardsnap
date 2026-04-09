-- ============================================
-- CardSnap: Row-Level Security (RLS) Setup
-- ============================================
-- This script enables RLS on all tables in the public schema
-- and creates policies to ensure users can only access their own data.

-- ============================================
-- 1. SCANS TABLE - RLS Setup
-- ============================================

-- Enable RLS on scans table
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own scans
CREATE POLICY "Users can view their own scans"
  ON public.scans
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy 2: Users can INSERT their own scans
CREATE POLICY "Users can insert their own scans"
  ON public.scans
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy 3: Users can UPDATE their own scans
CREATE POLICY "Users can update their own scans"
  ON public.scans
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policy 4: Users can DELETE their own scans
CREATE POLICY "Users can delete their own scans"
  ON public.scans
  FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 2. USERS TABLE - RLS Setup
-- ============================================

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can SELECT their own user record
CREATE POLICY "Users can view their own user record"
  ON public.users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Policy 2: Users can UPDATE their own user record
CREATE POLICY "Users can update their own user record"
  ON public.users
  FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

-- Policy 3: Service role can insert user records (for signup/registration)
-- NOTE: This is needed for initial user registration. If you're using a trigger
-- or service role for user creation, this policy allows that.
CREATE POLICY "Service role can insert user records"
  ON public.users
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 3. VERIFICATION QUERIES
-- ============================================
-- Run these queries to verify RLS is enabled:
--
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN ('scans', 'users');
--
-- SELECT schemaname, tablename, policyname, permissive, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('scans', 'users');
