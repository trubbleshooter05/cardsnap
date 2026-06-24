import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logEmailDelivery } from "@/lib/email-delivery-log";

type ScanRow = {
  card_name: string;
  result: {
    confirmedName?: string;
    rawValueMid?: number;
    gradedPSA9Value?: number;
    gradedPSA10Value?: number;
    worthGrading?: boolean;
    verdictReason?: string;
    roi?: { headlineVerdict?: string };
  } | null;
};

function formatUsd(n: number | undefined): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "—";
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function buildScanEmailHtml(scan: ScanRow, appUrl: string): string {
  const r = scan.result ?? {};
  const name = r.confirmedName ?? scan.card_name;
  const verdict = r.roi?.headlineVerdict ?? (r.worthGrading ? "grade" : "hold");
  return `<div style="font-family:system-ui,sans-serif;color:#111;max-width:560px">
  <h1 style="font-size:20px;margin:0 0 12px">Your CardSnap analysis</h1>
  <p style="margin:0 0 16px;font-size:16px;font-weight:600">${name}</p>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:8px 0;color:#666">Raw value</td><td style="text-align:right;font-weight:600">${formatUsd(r.rawValueMid)}</td></tr>
    <tr><td style="padding:8px 0;color:#666">If PSA 9</td><td style="text-align:right">${formatUsd(r.gradedPSA9Value)}</td></tr>
    <tr><td style="padding:8px 0;color:#666">If PSA 10</td><td style="text-align:right;color:#b45309;font-weight:600">${formatUsd(r.gradedPSA10Value)}</td></tr>
    <tr><td style="padding:8px 0;color:#666">Verdict</td><td style="text-align:right;font-weight:600">${verdict}</td></tr>
  </table>
  ${r.verdictReason ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#444">${r.verdictReason}</p>` : ""}
  <p style="margin:24px 0 0"><a href="${appUrl}" style="color:#b45309">Run another scan on CardSnap →</a></p>
</div>`;
}

export async function sendScanResultEmail(
  supabase: SupabaseClient,
  params: { email: string; scanId: string; source?: string }
): Promise<{ sent: boolean; reason?: string; providerId?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) {
    await logEmailDelivery(supabase, {
      email: params.email,
      kind: "scan_result",
      status: "skipped",
      scanId: params.scanId,
      source: params.source,
      errorMessage: "resend_not_configured",
    });
    return { sent: false, reason: "resend_not_configured" };
  }

  const { data: scan, error } = await supabase
    .from("scans")
    .select("card_name, result")
    .eq("id", params.scanId)
    .maybeSingle();

  if (error || !scan) {
    await logEmailDelivery(supabase, {
      email: params.email,
      kind: "scan_result",
      status: "failed",
      scanId: params.scanId,
      source: params.source,
      errorMessage: error?.message ?? "scan_not_found",
    });
    return { sent: false, reason: "scan_not_found" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://getcardsnap.com";
  const resend = new Resend(key);

  try {
    const { data, error: sendErr } = await resend.emails.send({
      from,
      to: params.email,
      subject: `CardSnap: ${scan.card_name}`,
      html: buildScanEmailHtml(scan as ScanRow, appUrl),
    });
    if (sendErr) throw sendErr;

    await logEmailDelivery(supabase, {
      email: params.email,
      kind: "scan_result",
      status: "sent",
      provider: "resend",
      providerId: data?.id ?? undefined,
      scanId: params.scanId,
      source: params.source,
    });
    return { sent: true, providerId: data?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "send_failed";
    await logEmailDelivery(supabase, {
      email: params.email,
      kind: "scan_result",
      status: "failed",
      provider: "resend",
      scanId: params.scanId,
      source: params.source,
      errorMessage: msg,
    });
    return { sent: false, reason: msg };
  }
}
