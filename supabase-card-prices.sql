-- card_prices: 24-hour cache for eBay Browse API results
-- Keyed by the normalised ebayQuery string so the same card from
-- multiple users only hits the eBay API once per 24 hours.
--
-- Apply in Supabase SQL editor, then reload the schema cache:
--   Dashboard → Project Settings → API → "Reload schema cache"

create table if not exists public.card_prices (
  id           uuid        primary key default gen_random_uuid(),
  card_query   text        not null unique,
  avg_price    numeric,
  min_price    numeric,
  max_price    numeric,
  recent_sales jsonb       not null default '[]',
  comp_source  text        not null default 'none',
  fetched_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '24 hours')
);

create index if not exists card_prices_query_idx      on public.card_prices (card_query);
create index if not exists card_prices_expires_at_idx on public.card_prices (expires_at);

-- Service role only — no public reads
alter table public.card_prices enable row level security;
