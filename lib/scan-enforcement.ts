import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

export type ScanEntitlement = {
  isPro: boolean;
  isAdmin?: boolean;
  prepaidCredits: number;
  userScansUsed: number;
  deviceScansUsed: number;
  ipScansUsed: number;
  isAuthenticated: boolean;
  privateSession: boolean;
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
  ipScansUsed = 0,
  opts?: { isAuthenticated?: boolean; privateSession?: boolean }
): number {
  if (opts?.privateSession && !opts?.isAuthenticated) {
    return 0;
  }
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
  ipScansUsed: number,
  opts?: { isAuthenticated?: boolean; privateSession?: boolean }
): boolean {
  if (opts?.privateSession && !opts?.isAuthenticated) {
    return true;
  }
  return !hasFreeScanAvailable(userScansUsed, deviceScansUsed, ipScansUsed);
}

export function hasUnlimitedScans(entitlement: ScanEntitlement): boolean {
  return entitlement.isPro || Boolean(entitlement.isAdmin);
}

export function isScanBlocked(entitlement: ScanEntitlement): boolean {
  const {
    isPro,
    prepaidCredits,
    userScansUsed,
    deviceScansUsed,
    ipScansUsed,
    isAuthenticated,
    privateSession,
  } = entitlement;
  if (hasUnlimitedScans(entitlement)) return false;
  if (privateSession && !isAuthenticated) {
    return prepaidCredits <= 0;
  }
  if (hasFreeScanAvailable(userScansUsed, deviceScansUsed, ipScansUsed)) {
    return false;
  }
  if (prepaidCredits > 0) return false;
  return true;
}

export function scanBlockedReason(
  entitlement: ScanEntitlement
): "user_limit" | "device_limit" | "ip_limit" | "private_session" | null {
  if (!isScanBlocked(entitlement)) return null;
  const {
    userScansUsed,
    deviceScansUsed,
    ipScansUsed,
    isAuthenticated,
    privateSession,
  } = entitlement;
  if (privateSession && !isAuthenticated) return "private_session";
  if (userScansUsed >= FREE_SCAN_LIMIT) return "user_limit";
  if (deviceScansUsed >= FREE_SCAN_LIMIT) return "device_limit";
  if (ipScansUsed >= FREE_SCAN_LIMIT) return "ip_limit";
  return "user_limit";
}
