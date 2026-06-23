import { waitForAccessToken } from "@/lib/wait-for-access-token";
import { createSupabaseBrowserClient } from "@/lib/supabase-client";
import { getOrCreateDeviceId } from "@/lib/device-id";

export async function mergeAnonymousScansToAuthUser(
  authUserId: string,
  anonymousUserId: string
): Promise<number> {
  if (!authUserId || !anonymousUserId || authUserId === anonymousUserId) {
    return 0;
  }

  const supabase = createSupabaseBrowserClient();
  const token = await waitForAccessToken(supabase, {
    context: "merge-anonymous",
    maxMs: 10_000,
  });
  if (!token) return 0;

  const deviceId = getOrCreateDeviceId();

  const res = await fetch("/api/merge-anonymous", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ anonymousUserId, deviceId }),
  });

  if (!res.ok) {
    console.warn("[cardsnap:auth] merge-anonymous failed", res.status);
    return 0;
  }

  const data = (await res.json()) as { merged?: number };
  return data.merged ?? 0;
}
