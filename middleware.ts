import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hostHeader(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  return raw.split(",")[0].trim().replace(/:\d+$/, "");
}

/**
 * Canonical host: apex only (301). Runs on Vercel Edge before the page.
 * Complements `vercel.json` (kept as backup if middleware is skipped).
 */
export function middleware(request: NextRequest) {
  if (hostHeader(request) !== "www.getcardsnap.com") {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.hostname = "getcardsnap.com";
  url.protocol = "https:";
  url.port = "";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/",
  ],
};
