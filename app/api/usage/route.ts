import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();

  // Support both authenticated requests and legacy anonymous requests
  const authHeader = req.headers.get("authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user?.id) {
      userId = user.id;
    }
  } else {
    // Fall back to query parameter for backwards compatibility with anonymous users
    userId = req.nextUrl.searchParams.get("userId");
  }

  if (!userId) {
    return NextResponse.json(
      { count: 0, isPro: false, limit: FREE_SCAN_LIMIT },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("is_pro")
    .eq("id", userId)
    .maybeSingle();

  const isPro = Boolean(userRow?.is_pro);

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

  return NextResponse.json(
    {
      count: count ?? 0,
      isPro,
      limit: FREE_SCAN_LIMIT,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
