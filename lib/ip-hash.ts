import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}

export function hashClientIp(req: NextRequest): string {
  const salt = process.env.IP_HASH_SALT ?? "cardsnap";
  return createHash("sha256")
    .update(`${salt}:${clientIp(req)}`)
    .digest("hex")
    .slice(0, 32);
}
