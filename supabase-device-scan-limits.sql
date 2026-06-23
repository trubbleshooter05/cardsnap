-- Device-level free scan tracking (run once in Supabase SQL editor).
alter table public.scans add column if not exists device_id text;
create index if not exists scans_device_id_idx on public.scans (device_id);
