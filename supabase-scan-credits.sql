-- Adds prepaid scan balance for Stripe scan-pack Checkout (payment mode).
-- Run in Supabase SQL editor once.
alter table public.users add column if not exists scan_credits int not null default 0;
