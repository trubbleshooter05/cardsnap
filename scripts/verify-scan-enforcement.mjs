import assert from "node:assert/strict";

const FREE_SCAN_LIMIT = 5;

function hasFreeScanAvailable(userScansUsed, deviceScansUsed) {
  return userScansUsed < FREE_SCAN_LIMIT && deviceScansUsed < FREE_SCAN_LIMIT;
}

function isScanBlocked(entitlement) {
  const { isPro, prepaidCredits, userScansUsed, deviceScansUsed } = entitlement;
  if (isPro) return false;
  if (hasFreeScanAvailable(userScansUsed, deviceScansUsed)) return false;
  if (prepaidCredits > 0) return false;
  return true;
}

assert.equal(isScanBlocked({ isPro: true, prepaidCredits: 0, userScansUsed: 999, deviceScansUsed: 999 }), false);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 5, deviceScansUsed: 0 }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 0, deviceScansUsed: 5 }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 10, userScansUsed: 43, deviceScansUsed: 40 }), false);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 10, userScansUsed: 2, deviceScansUsed: 5 }), false);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 2, deviceScansUsed: 5 }), true);

console.log("verify-scan-enforcement: ok");
