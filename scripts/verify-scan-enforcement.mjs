import assert from "node:assert/strict";

const FREE_SCAN_LIMIT = 5;

function hasFreeScanAvailable(userScansUsed, deviceScansUsed, ipScansUsed) {
  return (
    userScansUsed < FREE_SCAN_LIMIT &&
    deviceScansUsed < FREE_SCAN_LIMIT &&
    ipScansUsed < FREE_SCAN_LIMIT
  );
}

function isScanBlocked(entitlement) {
  const {
    isPro,
    prepaidCredits,
    userScansUsed,
    deviceScansUsed,
    ipScansUsed,
    isAuthenticated,
    privateSession,
  } = entitlement;
  if (isPro) return false;
  if (privateSession && !isAuthenticated) return prepaidCredits <= 0;
  if (hasFreeScanAvailable(userScansUsed, deviceScansUsed, ipScansUsed)) return false;
  if (prepaidCredits > 0) return false;
  return true;
}

assert.equal(isScanBlocked({ isPro: true, prepaidCredits: 0, userScansUsed: 999, deviceScansUsed: 999, ipScansUsed: 999, isAuthenticated: false, privateSession: true }), false);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 0, deviceScansUsed: 0, ipScansUsed: 0, isAuthenticated: false, privateSession: true }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 0, deviceScansUsed: 0, ipScansUsed: 0, isAuthenticated: true, privateSession: true }), false);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 5, deviceScansUsed: 0, ipScansUsed: 0, isAuthenticated: false, privateSession: false }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 0, userScansUsed: 0, deviceScansUsed: 0, ipScansUsed: 5, isAuthenticated: false, privateSession: false }), true);
assert.equal(isScanBlocked({ isPro: false, prepaidCredits: 10, userScansUsed: 43, deviceScansUsed: 40, ipScansUsed: 99, isAuthenticated: false, privateSession: false }), false);

console.log("verify-scan-enforcement: ok");
