import { NextRequest, NextResponse } from "next/server";
import { getCardComps } from "@/lib/card-comps";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { error: "Missing query" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await getCardComps(q);
    if (result == null) {
      return NextResponse.json(
        { error: "No comp data found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }
    const source =
      result.source === "dev_mock" ? "dev-mock" : (result.source ?? "live");
    return NextResponse.json(
      {
        query: q,
        source,
        comps: {
          avg: result.avg,
          min: result.min,
          max: result.max,
          prices: result.prices,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[api/card-comps]", e);
    return NextResponse.json(
      { error: "No comp data found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }
}
