import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { FREE_SCAN_LIMIT } from "@/lib/usage-limits";
import { resolveOrMintDeviceId } from "@/lib/server-device-id";
import { isScanBlocked } from "@/lib/scan-enforcement";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const deviceId = resolveOrMintDeviceId(req);

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
  const prepaid =
    typeof userRow?.scan_credits === "number" &&
    Number.isFinite(userRow.scan_credits)
      ? Math.max(0, userRow.scan_credits)
      : 0;
  const limit = isPro ? FREE_SCAN_LIMIT : FREE_SCAN_LIMIT + prepaid;

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

  const userScansUsed = count ?? 0;
  const blockedByDevice = isScanBlocked({
    isPro,
    prepaidCredits: prepaid,
    userScansUsed,
    deviceScansUsed,
  }) && !isPro && userScansUsed < limit;

  return NextResponse.json(
    {
      count: userScansUsed,
      isPro,
      limit,
      deviceScansUsed,
      deviceFreeScanLimit: FREE_SCAN_LIMIT,
      blockedByDevice,
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
