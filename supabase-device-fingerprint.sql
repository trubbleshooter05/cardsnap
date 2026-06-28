alter table public.scans add column if not exists device_fingerprint text;
create index if not exists scans_device_fingerprint_idx on public.scans (device_fingerprint);

create table if not exists public.device_fingerprint_links (
  fingerprint text not null,
  device_id text not null,
  created_at timestamptz not null default now(),
  primary key (fingerprint, device_id)
);

create table if not exists public.device_fingerprint_users (
  fingerprint text not null,
  user_id text not null,
  created_at timestamptz not null default now(),
  primary key (fingerprint, user_id)
);
