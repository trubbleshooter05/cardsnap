import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function startOfMonthUtc(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { count: 0, isPro: false, limit: 5 },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  }

  const supabase = createServerSupabase();

  const { data: userRow } = await supabase
    .from("users")
    .select("is_pro")
    .eq("id", userId)
    .maybeSingle();

  const isPro = Boolean(userRow?.is_pro);

  const { count, error } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonthUtc());

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

  return NextResponse.json(
    {
      count: count ?? 0,
      isPro,
      limit: 5,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
