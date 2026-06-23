import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase";
import { isValidUserId } from "@/lib/cardsnap-user-id";
import { resolveOrMintDeviceId } from "@/lib/server-device-id";
import { applyDeviceCookie } from "@/lib/scan-cookies";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  anonymousUserId: z.string().uuid(),
  deviceId: z.string().uuid().optional(),
});

/**
 * Reassign anonymous scans to the authenticated user so signup cannot reset free usage.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const supabase = createServerSupabase();
  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const authUserId = user.id;
  const { anonymousUserId } = parsed.data;

  if (!isValidUserId(anonymousUserId) || anonymousUserId === authUserId) {
    return NextResponse.json({ merged: 0 });
  }

  const { data: rows, error: selectError } = await supabase
    .from("scans")
    .select("id")
    .eq("user_id", anonymousUserId);

  if (selectError) {
    console.error("merge-anonymous select error", selectError);
    return NextResponse.json({ error: "merge_failed" }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ merged: 0 });
  }

  const deviceId = resolveOrMintDeviceId(req, parsed.data.deviceId);

  const { error: updateError } = await supabase
    .from("scans")
    .update({ user_id: authUserId })
    .eq("user_id", anonymousUserId);

  if (updateError) {
    console.error("merge-anonymous update error", updateError);
    return NextResponse.json({ error: "merge_failed" }, { status: 500 });
  }

  const response = NextResponse.json({ merged: rows.length });
  if (deviceId) {
    applyDeviceCookie(response, deviceId);
  }
  return response;
}
