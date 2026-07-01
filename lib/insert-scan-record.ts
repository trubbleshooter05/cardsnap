import type { SupabaseClient } from "@supabase/supabase-js";

export type ScanInsertPayload = {
  user_id: string;
  card_name: string;
  result: unknown;
  device_id?: string;
  ip_hash?: string;
  device_fingerprint?: string;
};

function isMissingFingerprintColumn(error: {
  code?: string;
  message?: string;
}): boolean {
  return (
    error.code === "PGRST204" &&
    Boolean(error.message?.includes("device_fingerprint"))
  );
}

/** Inserts a scan row; retries without device_fingerprint if migration not applied yet. */
export async function insertScanRecord(
  supabase: SupabaseClient,
  payload: ScanInsertPayload
) {
  const first = await supabase.from("scans").insert(payload).select("id").single();
  if (!first.error || !isMissingFingerprintColumn(first.error)) {
    return first;
  }

  console.warn(
    "[scan] device_fingerprint column missing — retrying insert without it (run supabase-device-fingerprint.sql)"
  );
  const rest = { ...payload };
  delete rest.device_fingerprint;
  return supabase.from("scans").insert(rest).select("id").single();
}
