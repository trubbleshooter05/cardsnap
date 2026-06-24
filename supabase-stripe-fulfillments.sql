-- Idempotent Stripe checkout fulfillment (run once in Supabase SQL editor).
create table if not exists public.stripe_checkout_fulfillments (
  checkout_session_id text primary key,
  user_id text not null,
  fulfillment_type text not null,
  pack_credits int,
  created_at timestamptz not null default now()
);
create index if not exists stripe_checkout_fulfillments_user_id_idx
  on public.stripe_checkout_fulfillments (user_id);

-- Track refund revocations (run once if table already exists).
alter table public.stripe_checkout_fulfillments
  add column if not exists revoked_at timestamptz;
