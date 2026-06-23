import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { CARDSNAP_DEVICE_COOKIE, isValidDeviceId } from "@/lib/cardsnap-device-id";

/**
 * Device id for scan limits. Cookie wins over body so clients cannot rotate ids per request.
 * Always returns a valid id (mints if missing).
 */
export function resolveOrMintDeviceId(
  req: NextRequest,
  bodyFallback?: string | null
): string {
  const cookieRaw = cookies().get(CARDSNAP_DEVICE_COOKIE)?.value;
  if (isValidDeviceId(cookieRaw)) return cookieRaw;

  if (isValidDeviceId(bodyFallback)) return bodyFallback;

  const query = req.nextUrl.searchParams.get("deviceId");
  if (isValidDeviceId(query)) return query;

  return randomUUID();
}
