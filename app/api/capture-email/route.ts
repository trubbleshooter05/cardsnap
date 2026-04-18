import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email, picks, scanId } = (await req.json()) as {
      email?: string;
      picks?: boolean;
      scanId?: string;
    };

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { error } = await supabase.from("email_leads").insert({
      email: email.toLowerCase().trim(),
      monthly_picks: picks ?? false,
      scan_id: scanId ?? null,
      source: "scan_result",
    });

    if (error) {
      console.error("email_leads insert error:", error);
      // Don't expose DB errors — silently succeed so UX isn't broken
      // even if the table doesn't exist yet
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("capture-email error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
