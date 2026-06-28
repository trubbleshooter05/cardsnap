alter table public.scans add column if not exists ip_hash text;
create index if not exists scans_ip_hash_idx on public.scans (ip_hash);
