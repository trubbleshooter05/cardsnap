import { NextRequest, NextResponse } from "next/server";
import { CARD_OPPORTUNITY_FALLBACK } from "@/lib/insights-fallback";

export const dynamic = "force-dynamic";

/**
 * Proxies to an optional internal insights service (not callable from the browser as localhost).
 * If unset or failing, returns curator fallback so the homepage widget is never a dead box.
 */
export async function GET(req: NextRequest) {
  const limit = Math.min(
    25,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? "5") || 5)
  );

  const base = process.env.INSIGHTS_API_BASE_URL?.replace(/\/$/, "");
  if (!base) {
    return NextResponse.json(
      { opportunities: CARD_OPPORTUNITY_FALLBACK.slice(0, limit) },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }

  try {
    const upstream = `${base}/api/insights/opportunities?site=cardsnap&limit=${limit}`;
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      console.warn("[insights] upstream HTTP", res.status, upstream);
      return NextResponse.json(
        { opportunities: CARD_OPPORTUNITY_FALLBACK.slice(0, limit) },
        { status: 200 }
      );
    }

    const data = (await res.json()) as { opportunities?: unknown[] };
    const list = Array.isArray(data.opportunities) ? data.opportunities : [];
    if (list.length === 0) {
      return NextResponse.json(
        { opportunities: CARD_OPPORTUNITY_FALLBACK.slice(0, limit) },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { opportunities: list.slice(0, limit) },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (e) {
    console.error("[insights] proxy failed", e);
    return NextResponse.json(
      { opportunities: CARD_OPPORTUNITY_FALLBACK.slice(0, limit) },
      { status: 200 }
    );
  }
}
