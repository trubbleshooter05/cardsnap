import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase";
import { analyzeCardWithOpenAI } from "@/lib/openai";
import { searchEbayItemPrices } from "@/lib/ebay";
import { fetchPsaPopulation } from "@/lib/psa";
import { mergeScanResults } from "@/lib/merge-scan";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(s: string | undefined): boolean {
  return Boolean(s && UUID_RE.test(s));
}

const bodySchema = z.object({
  cardName: z.string().min(1).max(500),
  condition: z.string().min(1).max(120),
  userId: z.string().uuid(),
});

export async function POST(req: Request) {
  const userId = cookies().get("cardsnap_user_id")?.value;
  if (!isValidUuid(userId)) {
    return NextResponse.json(
      { error: "invalid_user_id" },
      { status: 401 }
    );
  }

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

  const { cardName, condition } = parsed.data;
  const supabase = createServerSupabase();

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

  let ai: Awaited<ReturnType<typeof analyzeCardWithOpenAI>>;
  let ebay: Awaited<ReturnType<typeof searchEbayItemPrices>>;
  let psa: Awaited<ReturnType<typeof fetchPsaPopulation>>;
  try {
    [ai, ebay, psa] = await Promise.all([
      analyzeCardWithOpenAI(cardName, condition),
      searchEbayItemPrices(cardName),
      fetchPsaPopulation(cardName),
    ]);
  } catch (e) {
    console.error("scan upstream error", e);
    return NextResponse.json({ error: "openai_or_upstream_failed" }, { status: 502 });
  }

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

  return NextResponse.json({
    ...merged,
    scanId: inserted.id,
    /** @deprecated use freeScansUsed — kept for older clients */
    scansUsedThisMonth: freeScansUsed,
    freeScansUsed,
    freeScanLimit: FREE_SCAN_LIMIT,
    isPro: Boolean(proRow?.is_pro),
  });
}
