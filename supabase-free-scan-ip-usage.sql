create table if not exists public.free_scan_ip_usage (
  ip_hash text primary key,
  free_scans_used int not null default 0 check (free_scans_used >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists free_scan_ip_usage_updated_idx
  on public.free_scan_ip_usage (updated_at desc);

-- Backfill from scans that already store ip_hash.
insert into public.free_scan_ip_usage (ip_hash, free_scans_used)
select ip_hash, count(*)::int
from public.scans
where ip_hash is not null and ip_hash <> ''
group by ip_hash
on conflict (ip_hash) do update
  set free_scans_used = greatest(free_scan_ip_usage.free_scans_used, excluded.free_scans_used),
      updated_at = now();

create or replace function public.increment_ip_free_scans(p_ip_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.free_scan_ip_usage (ip_hash, free_scans_used)
  values (p_ip_hash, 1)
  on conflict (ip_hash) do update
    set free_scans_used = free_scan_ip_usage.free_scans_used + 1,
        updated_at = now();
end;
$$;
