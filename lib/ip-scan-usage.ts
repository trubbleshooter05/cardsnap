import type { SupabaseClient } from "@supabase/supabase-js";

export async function getIpFreeScansUsed(
  supabase: SupabaseClient,
  ipHash: string | null
): Promise<number | null> {
  if (!ipHash) return 0;

  let tableCount = 0;
  const { data: usageRow, error: usageError } = await supabase
    .from("free_scan_ip_usage")
    .select("free_scans_used")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (usageError) {
    if (!/free_scan_ip_usage|schema cache|PGRST/i.test(usageError.message)) {
      console.error("[ip-usage] table read failed", usageError);
      return null;
    }
  } else {
    tableCount = usageRow?.free_scans_used ?? 0;
  }

  const { count: scanCount, error: scanError } = await supabase
    .from("scans")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash);

  if (scanError) {
    console.error("[ip-usage] scans count failed", scanError);
    return tableCount > 0 ? tableCount : null;
  }

  return Math.max(tableCount, scanCount ?? 0);
}

export async function recordIpFreeScanUsage(
  supabase: SupabaseClient,
  ipHash: string | null
): Promise<void> {
  if (!ipHash) return;

  const { error: rpcError } = await supabase.rpc("increment_ip_free_scans", {
    p_ip_hash: ipHash,
  });
  if (!rpcError) return;

  const current = await getIpFreeScansUsed(supabase, ipHash);
  const next = (current ?? 0) + 1;
  const { error: upsertError } = await supabase.from("free_scan_ip_usage").upsert(
    {
      ip_hash: ipHash,
      free_scans_used: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "ip_hash" }
  );
  if (upsertError) {
    console.error("[ip-usage] increment failed", rpcError, upsertError);
  }
}
