import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";
import { resolveOrMintDeviceId } from "@/lib/server-device-id";
import { hashClientIp } from "@/lib/ip-hash";
import { getIpFreeScansUsed } from "@/lib/ip-scan-usage";
import { deriveDeviceFingerprint } from "@/lib/device-fingerprint";
import { getFingerprintScopedScanCount, syncFingerprintLinks } from "@/lib/fingerprint-usage";
import { isAdminEmail } from "@/lib/admin-access";
import { isScanBlocked, scansRemainingNonPro } from "@/lib/scan-enforcement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const deviceId = resolveOrMintDeviceId(req);
  const ipHash = hashClientIp(req);
  const privateSession = req.nextUrl.searchParams.get("privateSession") === "1";
  const deviceFingerprint = deriveDeviceFingerprint(req);

  // Support both authenticated requests and legacy anonymous requests
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;
  let isAuthenticated = false;
  let authEmail: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.id) {
      userId = user.id;
      isAuthenticated = true;
      authEmail = user.email ?? null;
    }
  } else {
    // Fall back to query parameter for backwards compatibility with anonymous users
    userId = req.nextUrl.searchParams.get("userId");
  }

  if (!userId) {
    return NextResponse.json(
      {
        count: 0,
        isPro: false,
        limit: FREE_SCAN_LIMIT,
        deviceScansUsed: 0,
        deviceFreeScanLimit: FREE_SCAN_LIMIT,
        blockedByDevice: false,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("is_pro, scan_credits")
    .eq("id", userId)
    .maybeSingle();

  const isPro = Boolean(userRow?.is_pro);
  const isAdmin = isAuthenticated && isAdminEmail(authEmail);
  const unlimitedScans = isPro || isAdmin;
  const prepaidCredits =
    typeof userRow?.scan_credits === "number" &&
    Number.isFinite(userRow.scan_credits)
      ? Math.max(0, userRow.scan_credits)
      : 0;
  const limit = unlimitedScans ? FREE_SCAN_LIMIT : FREE_SCAN_LIMIT + prepaidCredits;

  const { count, error } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("usage count error", error);
    return NextResponse.json(
      { error: "usage_fetch_failed" },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-store, max-age=0" },
      }
    );
  }

  let deviceScansUsed = 0;
  if (deviceId) {
    const { count: deviceCount, error: deviceError } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("device_id", deviceId);
    if (deviceError) {
      console.error("usage device count error", deviceError);
    } else {
      deviceScansUsed = deviceCount ?? 0;
    }
  }


  let ipScansUsed = 0;
  if (ipHash) {
    const ipCount = await getIpFreeScansUsed(supabase, ipHash);
    if (ipCount == null) {
      console.error("usage ip count unavailable");
    } else {
      ipScansUsed = ipCount;
    }
  }

  let userScansUsed = count ?? 0;
  if (!isAuthenticated) {
    await syncFingerprintLinks(supabase, deviceFingerprint, userId, deviceId, ipHash);
    const fpScoped = await getFingerprintScopedScanCount(supabase, deviceFingerprint);
    if (fpScoped == null) {
      console.error("usage fingerprint count unavailable");
    } else {
      userScansUsed = Math.max(userScansUsed, fpScoped);
      deviceScansUsed = Math.max(deviceScansUsed, fpScoped);
    }
  }

  const blockedByDevice = isScanBlocked({
    isPro,
    isAdmin,
    prepaidCredits,
    userScansUsed,
    deviceScansUsed,
    ipScansUsed,
    isAuthenticated,
    privateSession,
  }) && !unlimitedScans && prepaidCredits === 0;

  const scansRemaining = unlimitedScans
    ? null
    : scansRemainingNonPro(userScansUsed, prepaidCredits, deviceScansUsed, ipScansUsed, { isAuthenticated, privateSession });

  return NextResponse.json(
    {
      count: userScansUsed,
      isPro: unlimitedScans,
      isAdmin,
      limit,
      prepaidCredits,
      scansRemaining,
      deviceScansUsed,
      deviceFreeScanLimit: FREE_SCAN_LIMIT,
      ipScansUsed,
      privateSession,
      blockedByDevice,
      blockedByPrivateSession: privateSession && !isAuthenticated && !unlimitedScans && prepaidCredits === 0,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
