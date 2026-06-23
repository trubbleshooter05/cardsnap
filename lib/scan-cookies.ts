import type { NextResponse } from "next/server";
import { CARDSNAP_DEVICE_COOKIE, isValidDeviceId } from "@/lib/cardsnap-device-id";
import { CARDSNAP_USER_COOKIE, isValidUserId } from "@/lib/cardsnap-user-id";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function cookieOptions() {
  const secure =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax" as const,
    secure,
  };
}

export function applyUserCookie(res: NextResponse, userId: string): void {
  if (!isValidUserId(userId)) return;
  res.cookies.set(CARDSNAP_USER_COOKIE, userId, cookieOptions());
}

export function applyDeviceCookie(res: NextResponse, deviceId: string): void {
  if (!isValidDeviceId(deviceId)) return;
  res.cookies.set(CARDSNAP_DEVICE_COOKIE, deviceId, cookieOptions());
}
