import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase schema (apply in SQL editor):
 *
 * create table public.scans (
 *   id uuid primary key default gen_random_uuid(),
 *   user_id text,
 *   card_name text not null,
 *   result jsonb not null,
 *   created_at timestamptz not null default now()
 * );
 *
 * create table public.users (
 *   id text primary key,
 *   is_pro boolean not null default false,
 *   stripe_customer_id text,
 *   scan_count_this_month int not null default 0
 * );
 *
 * -- Optional: sync scan_count_this_month via trigger or cron; API counts from scans for limits.
 * -- RLS: enable as needed; server routes use service role for inserts/reads when set.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createBrowserSupabase(): SupabaseClient {
  return createClient(url, anonKey);
}

export function createServerSupabase(): SupabaseClient {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
