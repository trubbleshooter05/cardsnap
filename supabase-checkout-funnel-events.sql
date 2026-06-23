-- Optional: server-side checkout funnel (run once in CardSnap Supabase SQL editor).
create table if not exists public.checkout_funnel_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id text,
  checkout_session_id text,
  source text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists checkout_funnel_events_created_at_idx
  on public.checkout_funnel_events (created_at desc);
create index if not exists checkout_funnel_events_user_id_idx
  on public.checkout_funnel_events (user_id);
