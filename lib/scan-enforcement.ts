import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

export type ScanEntitlement = {
  isPro: boolean;
  prepaidCredits: number;
  userScansUsed: number;
  deviceScansUsed: number;
};

export type ScanEntitlementLimits = {
  userLimit: number;
  deviceFreeLimit: number;
};

export function scanEntitlementLimits(
  isPro: boolean,
  prepaidCredits: number
): ScanEntitlementLimits {
  return {
    userLimit: isPro ? Number.MAX_SAFE_INTEGER : FREE_SCAN_LIMIT + prepaidCredits,
    deviceFreeLimit: FREE_SCAN_LIMIT,
  };
}

/** True when a non-Pro scan must be rejected (402). Paid credits bypass device cap. */
export function isScanBlocked(entitlement: ScanEntitlement): boolean {
  const { isPro, prepaidCredits, userScansUsed, deviceScansUsed } = entitlement;
  if (isPro) return false;

  const { userLimit, deviceFreeLimit } = scanEntitlementLimits(isPro, prepaidCredits);

  if (userScansUsed >= userLimit) return true;
  if (prepaidCredits === 0 && deviceScansUsed >= deviceFreeLimit) return true;

  return false;
}

export function scanBlockedReason(
  entitlement: ScanEntitlement
): "user_limit" | "device_limit" | null {
  if (!isScanBlocked(entitlement)) return null;

  const { isPro, prepaidCredits, userScansUsed, deviceScansUsed } = entitlement;
  const { userLimit, deviceFreeLimit } = scanEntitlementLimits(isPro, prepaidCredits);

  if (userScansUsed >= userLimit) return "user_limit";
  if (prepaidCredits === 0 && deviceScansUsed >= deviceFreeLimit) return "device_limit";

  return "user_limit";
}
