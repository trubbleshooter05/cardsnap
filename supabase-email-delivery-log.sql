-- Email delivery audit log (run once in CardSnap Supabase SQL editor).
create table if not exists public.email_delivery_log (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kind text not null,
  status text not null,
  provider text,
  provider_id text,
  scan_id text,
  source text,
  error_message text,
  created_at timestamptz not null default now()
);
create index if not exists email_delivery_log_email_idx on public.email_delivery_log (email);
create index if not exists email_delivery_log_created_at_idx on public.email_delivery_log (created_at desc);
