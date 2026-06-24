import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

export type ScanEntitlement = {
  isPro: boolean;
  prepaidCredits: number;
  userScansUsed: number;
  deviceScansUsed: number;
};

export function freeScansRemaining(userScansUsed: number): number {
  return Math.max(0, FREE_SCAN_LIMIT - userScansUsed);
}

export function hasFreeScanAvailable(
  userScansUsed: number,
  deviceScansUsed: number
): boolean {
  return (
    userScansUsed < FREE_SCAN_LIMIT && deviceScansUsed < FREE_SCAN_LIMIT
  );
}

export function scansRemainingNonPro(
  userScansUsed: number,
  prepaidCredits: number
): number {
  return freeScansRemaining(userScansUsed) + Math.max(0, prepaidCredits);
}

export function shouldConsumePrepaidCredit(
  userScansUsed: number,
  deviceScansUsed: number
): boolean {
  return !hasFreeScanAvailable(userScansUsed, deviceScansUsed);
}

export function isScanBlocked(entitlement: ScanEntitlement): boolean {
  const { isPro, prepaidCredits, userScansUsed, deviceScansUsed } = entitlement;
  if (isPro) return false;
  if (hasFreeScanAvailable(userScansUsed, deviceScansUsed)) return false;
  if (prepaidCredits > 0) return false;
  return true;
}

export function scanBlockedReason(
  entitlement: ScanEntitlement
): "user_limit" | "device_limit" | null {
  if (!isScanBlocked(entitlement)) return null;
  const { userScansUsed, deviceScansUsed } = entitlement;
  if (userScansUsed >= FREE_SCAN_LIMIT) return "user_limit";
  if (deviceScansUsed >= FREE_SCAN_LIMIT) return "device_limit";
  return "user_limit";
}
