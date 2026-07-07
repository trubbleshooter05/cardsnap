import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase";
import { analyzeCardWithOpenAI } from "@/lib/openai";
import { searchEbayItemPrices, stripEbayDebug, withEbayDebug } from "@/lib/ebay";
import type { EbayCompDebug } from "@/lib/types";
import { fetchPsaPopulation } from "@/lib/psa";
import { mergeScanResults } from "@/lib/merge-scan";
import { insertScanRecord } from "@/lib/insert-scan-record";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";
import { CARDSNAP_USER_COOKIE, isValidUserId } from "@/lib/cardsnap-user-id";
import { resolveOrMintDeviceId } from "@/lib/server-device-id";
import { hashClientIp } from "@/lib/ip-hash";
import { getIpFreeScansUsed, recordIpFreeScanUsage } from "@/lib/ip-scan-usage";
import { deriveDeviceFingerprint } from "@/lib/device-fingerprint";
import { getFingerprintScopedScanCount, syncFingerprintLinks } from "@/lib/fingerprint-usage";
import { isAdminEmail } from "@/lib/admin-access";
import { isScanBlocked, scanBlockedReason, scansRemainingNonPro, shouldConsumePrepaidCredit } from "@/lib/scan-enforcement";
import { applyDeviceCookie, applyUserCookie } from "@/lib/scan-cookies";
import { withTimeout } from "@/lib/timeout";
import {
  applyCardMatchWarnings,
  parseCardIdentity,
  validateCardPricing,
} from "@/lib/card-identity";
import type {
  PostgrestMaybeSingleResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

/** Fallback when DB read times out (shape matches Supabase success + null row). */
const EMPTY_USER_ROW: PostgrestMaybeSingleResponse<{
  is_pro: boolean;
  scan_credits: number | null;
}> = {
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: "",
};

/** Head+count queries: union is strict; assertion matches timeout “unknown” result. */
const EMPTY_HEAD_COUNT = {
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: "",
} as unknown as PostgrestSingleResponse<unknown[]>;

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  cardName: z.string().min(1).max(500),
  condition: z.string().min(1).max(120),
  userId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
  privateSession: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const supabase = createServerSupabase();
  let userId: string | null = null;
  let isAuthenticated = false;
  let authEmail: string | null = null;
  const cookieRaw = cookies().get(CARDSNAP_USER_COOKIE)?.value;
  const bodyUserId = parsed.data.userId;
  const deviceId = resolveOrMintDeviceId(req, parsed.data.deviceId);
  const ipHash = hashClientIp(req);
  const deviceFingerprint = deriveDeviceFingerprint(req);
  const privateSession = parsed.data.privateSession === true;

  // First try to get user from auth token
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.id) {
      userId = user.id;
      isAuthenticated = true;
      authEmail = user.email ?? null;
    }
  }

  // Fall back to cookie or body userId
  if (!userId) {
    /** Prefer cookie; accept body id when cookie missing (e.g. first request before Set-Cookie applied). */
    if (isValidUserId(cookieRaw)) {
      userId = cookieRaw;
    } else if (isValidUserId(bodyUserId)) {
      userId = bodyUserId;
    } else {
      return NextResponse.json(
        { error: "invalid_user_id" },
        { status: 401 }
      );
    }
  }

  const cookieMismatch =
    isValidUserId(cookieRaw) &&
    isValidUserId(bodyUserId) &&
    cookieRaw !== bodyUserId;

  const { cardName, condition } = parsed.data;

  const userResult = await withTimeout(
    supabase
      .from("users")
      .select("is_pro, scan_credits")
      .eq("id", userId)
      .maybeSingle(),
    3000,
    EMPTY_USER_ROW,
    "scan.db.user"
  );
  const { data: userRow } = userResult;
  const isPro = Boolean(userRow?.is_pro);
  const isAdmin = isAuthenticated && isAdminEmail(authEmail);
  const prepaidCredits =
    typeof userRow?.scan_credits === "number" && Number.isFinite(userRow.scan_credits)
      ? Math.max(0, userRow.scan_credits)
      : 0;

  const usedResult = await withTimeout(
    supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    3000,
    EMPTY_HEAD_COUNT,
    "scan.db.usedcount"
  );
  let userScansUsed = usedResult.count;
  if (userScansUsed == null) {
    console.error("[scan] user scan count unavailable — blocking (fail closed)");
    return NextResponse.json({ error: "usage_check_failed" }, { status: 503 });
  }

  let deviceScansUsed = 0;
  if (deviceId) {
    const deviceUsedResult = await withTimeout(
      supabase
        .from("scans")
        .select("*", { count: "exact", head: true })
        .eq("device_id", deviceId),
      3000,
      EMPTY_HEAD_COUNT,
      "scan.db.deviceusedcount"
    );
    const rawDeviceCount = deviceUsedResult.count;
    if (rawDeviceCount == null) {
      console.error("[scan] device scan count unavailable — blocking (fail closed)");
      return NextResponse.json({ error: "usage_check_failed" }, { status: 503 });
    }
    deviceScansUsed = rawDeviceCount;
  }

  if (!isAuthenticated) {
    await syncFingerprintLinks(supabase, deviceFingerprint, userId, deviceId, ipHash);
    const fpScoped = await withTimeout(
      getFingerprintScopedScanCount(supabase, deviceFingerprint),
      3000,
      null,
      "scan.db.fingerprintcount"
    );
    if (fpScoped == null) {
      console.error("[scan] fingerprint scan count unavailable — blocking (fail closed)");
      return NextResponse.json({ error: "usage_check_failed" }, { status: 503 });
    }
    userScansUsed = Math.max(userScansUsed, fpScoped);
    deviceScansUsed = Math.max(deviceScansUsed, fpScoped);
  }

  let ipScansUsed = 0;
  if (ipHash) {
    const rawIpCount = await withTimeout(
      getIpFreeScansUsed(supabase, ipHash),
      3000,
      null,
      "scan.db.ipusedcount"
    );
    if (rawIpCount == null) {
      console.error("[scan] ip scan count unavailable — blocking (fail closed)");
      return NextResponse.json({ error: "usage_check_failed" }, { status: 503 });
    }
    ipScansUsed = rawIpCount;
  }

  const entitlement = {
    isPro,
    isAdmin,
    prepaidCredits,
    userScansUsed,
    deviceScansUsed,
    ipScansUsed,
    isAuthenticated,
    privateSession,
  };

  if (isScanBlocked(entitlement)) {
    const reason = scanBlockedReason(entitlement) ?? "user_limit";
    return NextResponse.json(
      { error: "scan_limit_reached", reason },
      { status: 402 }
    );
  }

  const cardIdentity = parseCardIdentity(cardName);
  console.log("[scan] starting analysis for card:", cardName, "condition:", condition, "ebayQuery:", cardIdentity.ebayQuery);

  let ai: Awaited<ReturnType<typeof analyzeCardWithOpenAI>>;
  let ebay: Awaited<ReturnType<typeof searchEbayItemPrices>>;
  let ebayDebug: EbayCompDebug | undefined;
  let psa: Awaited<ReturnType<typeof fetchPsaPopulation>>;

  try {
    // Use allSettled so one slow/failed provider doesn't block the others
    const results = await Promise.allSettled([
      analyzeCardWithOpenAI(cardName, condition, cardIdentity),
      searchEbayItemPrices(cardIdentity.ebayQuery, supabase),
      fetchPsaPopulation(cardName),
    ]);

    ai = results[0]?.status === "fulfilled" ? results[0].value : { confirmedName: cardName, year: "", player: "", set: "", sport: "", rawValueLow: 0, rawValueMid: 0, rawValueHigh: 0, gradedPSA9Value: 0, gradedPSA10Value: 0, worthGrading: false, verdictReason: "Analysis unavailable." };
    const ebayRaw = results[1]?.status === "fulfilled" ? results[1].value : { avgSoldPrice: null, minSoldPrice: null, maxSoldPrice: null, recentSales: [], compSource: "none" as const };
    ebayDebug = ebayRaw.debug;
    ebay = stripEbayDebug(ebayRaw);
    psa = results[2]?.status === "fulfilled" ? results[2].value : null;

    console.log("[scan] ebay result", {
      compSource: ebay.compSource,
      avgSoldPrice: ebay.avgSoldPrice,
      query: cardIdentity.ebayQuery,
      fallbackReason: ebayDebug?.fallbackReason,
      tokenStatus: ebayDebug?.tokenStatus,
      browseHttpStatus: ebayDebug?.browseHttpStatus,
      itemSummaryCount: ebayDebug?.itemSummaryCount,
    });

    if (results[0]?.status === "rejected") {
      console.error("[scan] OpenAI failed:", results[0].reason);
    }
    if (results[1]?.status === "rejected") {
      console.error("[scan] eBay failed:", results[1].reason);
    }
    if (results[2]?.status === "rejected") {
      console.error("[scan] PSA failed:", results[2].reason);
    }
  } catch (e) {
    console.error("[scan] unexpected error during analysis", e);
    return NextResponse.json({ error: "analysis_failed" }, { status: 502 });
  }

  console.log("[scan] analysis complete, merging results");

  let merged = mergeScanResults(ai, ebay, psa);
  const matchValidation = validateCardPricing(cardName, merged, ebay.avgSoldPrice);
  if (!matchValidation.ok) {
    console.warn("[scan] card match warnings", matchValidation.warnings);
    merged = applyCardMatchWarnings(merged, matchValidation);
  }

  const insertPayload: {
    user_id: string;
    card_name: string;
    result: typeof merged;
    device_id?: string;
    ip_hash?: string;
    device_fingerprint?: string;
  } = {
    user_id: userId,
    card_name: cardName,
    result: merged,
  };
  if (deviceId) {
    insertPayload.device_id = deviceId;
  }
  if (ipHash) {
    insertPayload.ip_hash = ipHash;
  }
  if (deviceFingerprint) {
    insertPayload.device_fingerprint = deviceFingerprint;
  }

  const insertResult = await withTimeout(
    insertScanRecord(supabase, insertPayload),
    5000,
    null,
    "scan.db.insert"
  );

  if (!insertResult) {
    console.error("scan insert timeout");
    return NextResponse.json(
      { error: "save_failed" },
      { status: 500 }
    );
  }

  const { data: inserted, error: insertError } = insertResult;

  if (insertError) {
    console.error("scan insert error", insertError);
    return NextResponse.json(
      {
        error: "save_failed",
        ...(process.env.NODE_ENV === "development"
          ? { hint: insertError.message }
          : {}),
      },
      { status: 500 }
    );
  }

  if (
    !isPro &&
    !isAdmin &&
    ipHash &&
    !shouldConsumePrepaidCredit(userScansUsed, deviceScansUsed, ipScansUsed, {
      isAuthenticated,
      privateSession,
    })
  ) {
    await recordIpFreeScanUsage(supabase, ipHash);
  }

  if (
    !isPro &&
    !isAdmin &&
    prepaidCredits > 0 &&
    shouldConsumePrepaidCredit(userScansUsed, deviceScansUsed, ipScansUsed, { isAuthenticated, privateSession })
  ) {
    const nextCredits = Math.max(0, prepaidCredits - 1);
    const { error: creditErr } = await supabase
      .from("users")
      .update({ scan_credits: nextCredits })
      .eq("id", userId);
    if (creditErr) {
      console.error("[scan] prepaid credit decrement failed", creditErr);
    }
  }

  if (cookieMismatch) {
    console.warn("scan: cardsnap_user_id cookie differs from body userId; using cookie");
  }

  const countResult = await withTimeout(
    supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    3000,
    EMPTY_HEAD_COUNT,
    "scan.db.count"
  );
  const freeScansUsed = countResult.count ?? 0;

  const proResult = await withTimeout(
    supabase
      .from("users")
      .select("is_pro, scan_credits")
      .eq("id", userId)
      .maybeSingle(),
    3000,
    EMPTY_USER_ROW,
    "scan.db.pro"
  );
  const { data: proRow } = proResult;
  const isProResponse = Boolean(proRow?.is_pro);
  const unlimitedScans = isProResponse || isAdmin;
  const prepaidForLimit =
    typeof proRow?.scan_credits === "number" &&
    Number.isFinite(proRow.scan_credits)
      ? Math.max(0, proRow.scan_credits)
      : 0;
  /** Total non-Pro scan allowance (included free scans + prepaid pack credits). */
  const tierScanLimit =
    FREE_SCAN_LIMIT + (unlimitedScans ? 0 : prepaidForLimit);

  console.log("[scan] returning response with merged data");
  const response = NextResponse.json({
    ...merged,
    ebay: withEbayDebug(merged.ebay, ebayDebug),
    scanId: inserted.id,
    /** @deprecated use freeScansUsed — kept for older clients */
    scansUsedThisMonth: freeScansUsed,
    freeScansUsed,
    freeScanLimit: tierScanLimit,
    prepaidCredits: unlimitedScans ? 0 : prepaidForLimit,
    scansRemaining: unlimitedScans
      ? null
      : scansRemainingNonPro(freeScansUsed, prepaidForLimit, deviceScansUsed, ipScansUsed, { isAuthenticated, privateSession }),
    deviceScansUsed: deviceId ? deviceScansUsed + 1 : deviceScansUsed,
    deviceFreeScanLimit: FREE_SCAN_LIMIT,
    isPro: unlimitedScans,
    isAdmin,
  });
  // Always refresh sticky ids so Safari keeps the same bucket across scans.
  if (isValidUserId(userId)) {
    applyUserCookie(response, userId);
  }
  applyDeviceCookie(response, deviceId);
  return response;
}
