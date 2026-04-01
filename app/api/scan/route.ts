import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase";
import { analyzeCardWithOpenAI } from "@/lib/openai";
import { searchEbayItemPrices } from "@/lib/ebay";
import { fetchPsaPopulation } from "@/lib/psa";
import { mergeScanResults } from "@/lib/merge-scan";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  cardName: z.string().min(1).max(500),
  condition: z.string().min(1).max(120),
  userId: z.union([z.string().uuid(), z.null()]).optional(),
});

function startOfMonthUtc(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function POST(req: Request) {
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

  const { cardName, condition, userId } = parsed.data;
  const supabase = createServerSupabase();

  if (userId) {
    const { data: userRow } = await supabase
      .from("users")
      .select("is_pro")
      .eq("id", userId)
      .maybeSingle();

    const isPro = Boolean(userRow?.is_pro);

    const { count } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonthUtc());

    const used = count ?? 0;
    if (!isPro && used >= 5) {
      return NextResponse.json(
        { error: "scan_limit_reached" },
        { status: 402 }
      );
    }
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
      user_id: userId ?? null,
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

  let scansUsedThisMonth = 0;
  if (userId) {
    const { count: afterCount } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", startOfMonthUtc());
    scansUsedThisMonth = afterCount ?? 0;
  }

  const { data: proRow } = userId
    ? await supabase.from("users").select("is_pro").eq("id", userId).maybeSingle()
    : { data: null };

  return NextResponse.json({
    ...merged,
    scanId: inserted.id,
    scansUsedThisMonth,
    freeScanLimit: 5,
    isPro: Boolean(proRow?.is_pro),
  });
}
