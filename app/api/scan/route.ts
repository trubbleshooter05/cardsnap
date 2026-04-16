import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase";
import { analyzeCardWithOpenAI } from "@/lib/openai";
import { searchEbayItemPrices } from "@/lib/ebay";
import { fetchPsaPopulation } from "@/lib/psa";
import { mergeScanResults } from "@/lib/merge-scan";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";
import { CARDSNAP_USER_COOKIE, isValidUserId } from "@/lib/cardsnap-user-id";

export const dynamic = "force-dynamic";

function setUserCookieHeader(userId: string): Record<string, string> {
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1";
  const cookie = `${CARDSNAP_USER_COOKIE}=${encodeURIComponent(
    userId
  )}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
  return { "Set-Cookie": cookie };
}

const bodySchema = z.object({
  cardName: z.string().min(1).max(500),
  condition: z.string().min(1).max(120),
  userId: z.string().uuid(),
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
  const cookieRaw = cookies().get(CARDSNAP_USER_COOKIE)?.value;
  const bodyUserId = parsed.data.userId;

  // First try to get user from auth token
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.id) {
      userId = user.id;
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

  const { data: userRow } = await supabase
    .from("users")
    .select("is_pro")
    .eq("id", userId)
    .maybeSingle();

  const isPro = Boolean(userRow?.is_pro);

  const { count: usedBeforeInsert } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const used = usedBeforeInsert ?? 0;
  if (!isPro && used >= FREE_SCAN_LIMIT) {
    return NextResponse.json(
      { error: "scan_limit_reached" },
      { status: 402 }
    );
  }

  console.log("[scan] starting analysis for card:", cardName, "condition:", condition);

  let ai: Awaited<ReturnType<typeof analyzeCardWithOpenAI>>;
  let ebay: Awaited<ReturnType<typeof searchEbayItemPrices>>;
  let psa: Awaited<ReturnType<typeof fetchPsaPopulation>>;

  try {
    // Use allSettled so one slow/failed provider doesn't block the others
    const results = await Promise.allSettled([
      analyzeCardWithOpenAI(cardName, condition),
      searchEbayItemPrices(cardName),
      fetchPsaPopulation(cardName),
    ]);

    ai = results[0]?.status === "fulfilled" ? results[0].value : { confirmedName: cardName, year: "", player: "", set: "", sport: "", rawValueLow: 0, rawValueMid: 0, rawValueHigh: 0, gradedPSA9Value: 0, gradedPSA10Value: 0, worthGrading: false, verdictReason: "Analysis unavailable." };
    ebay = results[1]?.status === "fulfilled" ? results[1].value : { avgSoldPrice: null, minSoldPrice: null, maxSoldPrice: null, recentSales: [] };
    psa = results[2]?.status === "fulfilled" ? results[2].value : null;

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

  const merged = mergeScanResults(ai, ebay, psa);

  const { data: inserted, error: insertError } = await supabase
    .from("scans")
    .insert({
      user_id: userId,
      card_name: cardName,
      result: merged,
    })
    .select("id")
    .single();

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

  const extraHeaders: Record<string, string> = {};
  if (!isValidUserId(cookieRaw) && isValidUserId(userId)) {
    Object.assign(extraHeaders, setUserCookieHeader(userId));
  }
  if (cookieMismatch) {
    console.warn("scan: cardsnap_user_id cookie differs from body userId; using cookie");
  }

  const { count: afterCount } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  const freeScansUsed = afterCount ?? 0;

  const { data: proRow } = await supabase
    .from("users")
    .select("is_pro")
    .eq("id", userId)
    .maybeSingle();

  console.log("[scan] returning response with merged data");
  return NextResponse.json(
    {
      ...merged,
      scanId: inserted.id,
      /** @deprecated use freeScansUsed — kept for older clients */
      scansUsedThisMonth: freeScansUsed,
      freeScansUsed,
      freeScanLimit: FREE_SCAN_LIMIT,
      isPro: Boolean(proRow?.is_pro),
    },
    { headers: extraHeaders }
  );
}
