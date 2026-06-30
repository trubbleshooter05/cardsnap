import type { SupabaseClient } from "@supabase/supabase-js";

export async function syncFingerprintLinks(
  supabase: SupabaseClient,
  fingerprint: string,
  userId: string,
  deviceId: string | null,
  ipHash: string | null = null
): Promise<void> {
  await supabase.from("device_fingerprint_users").upsert(
    { fingerprint, user_id: userId },
    { onConflict: "fingerprint,user_id" }
  );

  const deviceIds = new Set<string>();
  if (deviceId) deviceIds.add(deviceId);

  const { data: historicalDevices } = await supabase
    .from("scans")
    .select("device_id")
    .eq("user_id", userId)
    .not("device_id", "is", null)
    .limit(100);
  for (const row of historicalDevices ?? []) {
    if (row.device_id) deviceIds.add(row.device_id);
  }

  if (ipHash) {
    const { data: ipRows } = await supabase
      .from("scans")
      .select("device_id, user_id")
      .eq("ip_hash", ipHash)
      .limit(200);
    for (const row of ipRows ?? []) {
      if (row.device_id) deviceIds.add(row.device_id);
      if (row.user_id) {
        await supabase.from("device_fingerprint_users").upsert(
          { fingerprint, user_id: row.user_id },
          { onConflict: "fingerprint,user_id" }
        );
      }
    }
  }

  if (deviceIds.size) {
    await supabase.from("device_fingerprint_links").upsert(
      Array.from(deviceIds).map((device_id) => ({ fingerprint, device_id })),
      { onConflict: "fingerprint,device_id" }
    );
  }
}

export async function getFingerprintScopedScanCount(
  supabase: SupabaseClient,
  fingerprint: string
): Promise<number | null> {
  const { data: devices, error: deviceLinkError } = await supabase
    .from("device_fingerprint_links")
    .select("device_id")
    .eq("fingerprint", fingerprint);
  if (deviceLinkError) {
    if (/device_fingerprint_links|schema cache|PGRST/i.test(deviceLinkError.message)) {
      return 0;
    }
    console.error("[fingerprint] device link read failed", deviceLinkError);
    return null;
  }

  const { data: users, error: userLinkError } = await supabase
    .from("device_fingerprint_users")
    .select("user_id")
    .eq("fingerprint", fingerprint);
  if (userLinkError) {
    if (/device_fingerprint_users|schema cache|PGRST/i.test(userLinkError.message)) {
      return 0;
    }
    console.error("[fingerprint] user link read failed", userLinkError);
    return null;
  }

  const deviceIds = Array.from(new Set((devices ?? []).map((row) => row.device_id).filter(Boolean)));
  const userIds = Array.from(new Set((users ?? []).map((row) => row.user_id).filter(Boolean)));

  let maxCount = 0;

  const { count: fpCount, error: fpError } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("device_fingerprint", fingerprint);
  if (fpError) {
    if (/device_fingerprint|schema cache|PGRST204/i.test(fpError.message)) {
      console.warn("[fingerprint] device_fingerprint column missing — skipping fp count");
    } else {
      console.error("[fingerprint] fingerprint count failed", fpError);
      return null;
    }
  } else {
    maxCount = Math.max(maxCount, fpCount ?? 0);
  }

  if (deviceIds.length) {
    const { count, error } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .in("device_id", deviceIds);
    if (error) {
      console.error("[fingerprint] device count failed", error);
      return null;
    }
    maxCount = Math.max(maxCount, count ?? 0);
  }

  if (userIds.length) {
    const { count, error } = await supabase
      .from("scans")
      .select("*", { count: "exact", head: true })
      .in("user_id", userIds);
    if (error) {
      console.error("[fingerprint] user count failed", error);
      return null;
    }
    maxCount = Math.max(maxCount, count ?? 0);
  }

  return maxCount;
}
