import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin-access";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const supabase = createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return NextResponse.json({ isAdmin: false }, { status: 401 });
  }

  const isAdmin = isAdminEmail(user.email);
  return NextResponse.json(
    { isAdmin, email: user.email },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  );
}
