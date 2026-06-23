import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { CARDSNAP_DEVICE_COOKIE, isValidDeviceId } from "@/lib/cardsnap-device-id";

/** Resolve device id from cookie, then optional body/query fallback. */
export function resolveDeviceId(
  req: NextRequest,
  fallback?: string | null
): string | null {
  const cookieRaw = cookies().get(CARDSNAP_DEVICE_COOKIE)?.value;
  if (isValidDeviceId(cookieRaw)) return cookieRaw;
  if (isValidDeviceId(fallback)) return fallback;
  const query = req.nextUrl.searchParams.get("deviceId");
  if (isValidDeviceId(query)) return query;
  return null;
}
