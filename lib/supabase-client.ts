import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function throwMissingPublicEnvBrowser(): never {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables"
  );
}

function throwStubUsedDuringSSR(): never {
  throw new Error(
    "Supabase browser client was invoked during SSR without public env vars. Use lazy init inside useEffect or event handlers."
  );
}

/**
 * When NEXT_PUBLIC_* are unset during `next build` / RSC prerender, a real client cannot be created.
 * Return a placeholder so static generation can finish; any real API use must run in the browser with env set at build time.
 */
function createPrerenderPlaceholder(): SupabaseClient {
  const handler = (): never => throwStubUsedDuringSSR();
  return new Proxy({} as SupabaseClient, {
    get: handler,
    apply: handler,
  });
}

/**
 * Browser client with auth session management.
 * Use for authentication and real-time updates.
 */
export function createSupabaseBrowserClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    if (typeof window === "undefined") {
      cachedClient = createPrerenderPlaceholder();
      return cachedClient;
    }
    throwMissingPublicEnvBrowser();
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}
