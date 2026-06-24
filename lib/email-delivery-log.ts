import type { SupabaseClient } from "@supabase/supabase-js";

export type EmailDeliveryKind = "scan_result" | "monthly_picks_opt_in";

export async function logEmailDelivery(
  supabase: SupabaseClient,
  row: {
    email: string;
    kind: EmailDeliveryKind;
    status: "sent" | "failed" | "skipped";
    provider?: string;
    providerId?: string;
    scanId?: string;
    source?: string;
    errorMessage?: string;
  }
): Promise<void> {
  const { error } = await supabase.from("email_delivery_log").insert({
    email: row.email.toLowerCase().trim(),
    kind: row.kind,
    status: row.status,
    provider: row.provider ?? null,
    provider_id: row.providerId ?? null,
    scan_id: row.scanId ?? null,
    source: row.source ?? null,
    error_message: row.errorMessage ?? null,
  });
  if (error) {
    console.warn("[email-delivery-log] insert skipped:", error.message);
  }
}
