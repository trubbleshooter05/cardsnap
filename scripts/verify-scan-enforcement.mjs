import assert from "node:assert/strict";

const FREE_SCAN_LIMIT = 5;

function scanEntitlementLimits(isPro, prepaidCredits) {
  return {
    userLimit: isPro ? Number.MAX_SAFE_INTEGER : FREE_SCAN_LIMIT + prepaidCredits,
    deviceFreeLimit: FREE_SCAN_LIMIT,
  };
}

function isScanBlocked(entitlement) {
  const { isPro, prepaidCredits, userScansUsed, deviceScansUsed } = entitlement;
  if (isPro) return false;
  const { userLimit, deviceFreeLimit } = scanEntitlementLimits(isPro, prepaidCredits);
  if (userScansUsed >= userLimit) return true;
  if (prepaidCredits === 0 && deviceScansUsed >= deviceFreeLimit) return true;
  return false;
}

assert.equal(isScanBlocked({ isPro: true, prepaidCredits: 0, userScansUsed: 999, deviceScansUsed: 999 }), false);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 5, deviceScansUsed: 0 }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 0, deviceScansUsed: 5 }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 10, userScansUsed: 2, deviceScansUsed: 5 }), false);

console.log("verify-scan-enforcement: ok");
