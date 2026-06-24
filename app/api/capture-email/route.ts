import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { logEmailDelivery } from "@/lib/email-delivery-log";
import { sendScanResultEmail } from "@/lib/send-scan-result-email";

export async function POST(req: Request) {
  try {
    const { email, picks, scanId, source } = (await req.json()) as {
      email?: string;
      picks?: boolean;
      scanId?: string;
      source?: string;
    };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();
    const allowedSources = new Set(["scan_result", "pre_paywall", "pricing"]);
    const leadSource =
      source && allowedSources.has(source) ? source : "scan_result";

    const supabase = createServerSupabase();
    const { error: leadErr } = await supabase.from("email_leads").insert({
      email: normalized,
      monthly_picks: picks ?? false,
      scan_id: scanId ?? null,
      source: leadSource,
    });

    if (leadErr) {
      console.error("email_leads insert error:", leadErr);
    }

    if (picks) {
      await logEmailDelivery(supabase, {
        email: normalized,
        kind: "monthly_picks_opt_in",
        status: "skipped",
        source: leadSource,
        errorMessage: "newsletter_batch_not_implemented",
      });
    }

    let emailSent = false;
    let emailReason: string | undefined;
    if (scanId) {
      const result = await sendScanResultEmail(supabase, {
        email: normalized,
        scanId,
        source: leadSource,
      });
      emailSent = result.sent;
      emailReason = result.reason;
    }

    return NextResponse.json({
      ok: true,
      leadSaved: !leadErr,
      emailSent,
      emailReason: emailReason ?? null,
      picksOptIn: Boolean(picks),
    });
  } catch (err) {
    console.error("capture-email error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
