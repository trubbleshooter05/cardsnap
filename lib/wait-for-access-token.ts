import { createSupabaseBrowserClient } from "@/lib/supabase-client";

type Supabase = ReturnType<typeof createSupabaseBrowserClient>;

const LOG = "[cardsnap:auth]";

/**
 * Resolves a JWT for authenticated API calls (checkout, account sync, etc.).
 * Unlike the 5s-raced getSession() used in the scan path, this retries briefly so
 * desktop Chrome can complete session persistence right after sign-in.
 */
export async function waitForAccessToken(
  supabase: Supabase,
  options?: { context?: string; maxMs?: number }
): Promise<string | null> {
  const ctx = options?.context ?? "app";
  const maxMs = options?.maxMs ?? 20_000;
  const t0 = Date.now();
  let attempt = 0;

  while (Date.now() - t0 < maxMs) {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn(LOG, "getSession error", { ctx, message: error.message, attempt });
      }
      const t = data.session?.access_token;
      if (t) {
        console.log(LOG, "session: access token found", { ctx, attempt });
        return t;
      }
    } catch (e) {
      console.warn(LOG, "getSession threw", { ctx, attempt, e });
    }
    attempt += 1;
    const wait = Math.min(400, 60 + attempt * 40);
    await new Promise((r) => setTimeout(r, wait));
  }

  console.warn(LOG, "session: no access token before timeout", { ctx, maxMs, attempt });
  return null;
}
