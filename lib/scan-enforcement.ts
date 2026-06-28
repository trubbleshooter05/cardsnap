import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

export type ScanEntitlement = {
  isPro: boolean;
  prepaidCredits: number;
  userScansUsed: number;
  deviceScansUsed: number;
  ipScansUsed: number;
};

export function freeScansRemaining(userScansUsed: number): number {
  return Math.max(0, FREE_SCAN_LIMIT - userScansUsed);
}

export function hasFreeScanAvailable(
  userScansUsed: number,
  deviceScansUsed: number,
  ipScansUsed: number
): boolean {
  return (
    userScansUsed < FREE_SCAN_LIMIT &&
    deviceScansUsed < FREE_SCAN_LIMIT &&
    ipScansUsed < FREE_SCAN_LIMIT
  );
}

export function scansRemainingNonPro(
  userScansUsed: number,
  prepaidCredits: number,
  deviceScansUsed = 0,
  ipScansUsed = 0
): number {
  const freeLeft = Math.min(
    freeScansRemaining(userScansUsed),
    Math.max(0, FREE_SCAN_LIMIT - deviceScansUsed),
    Math.max(0, FREE_SCAN_LIMIT - ipScansUsed)
  );
  return freeLeft + Math.max(0, prepaidCredits);
}

export function shouldConsumePrepaidCredit(
  userScansUsed: number,
  deviceScansUsed: number,
  ipScansUsed: number
): boolean {
  return !hasFreeScanAvailable(userScansUsed, deviceScansUsed, ipScansUsed);
}

export function isScanBlocked(entitlement: ScanEntitlement): boolean {
  const { isPro, prepaidCredits, userScansUsed, deviceScansUsed, ipScansUsed } =
    entitlement;
  if (isPro) return false;
  if (hasFreeScanAvailable(userScansUsed, deviceScansUsed, ipScansUsed)) {
    return false;
  }
  if (prepaidCredits > 0) return false;
  return true;
}

export function scanBlockedReason(
  entitlement: ScanEntitlement
): "user_limit" | "device_limit" | "ip_limit" | null {
  if (!isScanBlocked(entitlement)) return null;
  const { userScansUsed, deviceScansUsed, ipScansUsed } = entitlement;
  if (userScansUsed >= FREE_SCAN_LIMIT) return "user_limit";
  if (deviceScansUsed >= FREE_SCAN_LIMIT) return "device_limit";
  if (ipScansUsed >= FREE_SCAN_LIMIT) return "ip_limit";
  return "user_limit";
}
