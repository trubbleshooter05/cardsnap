import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser client with auth session management.
 * Use for authentication and real-time updates.
 */
export function createSupabaseBrowserClient() {
  return createClient(url, anonKey);
}
