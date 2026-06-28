import { createHash } from "crypto";
import type { NextRequest } from "next/server";

const IP_HEADERS = [
  "x-real-ip",
  "x-vercel-forwarded-for",
  "x-forwarded-for",
  "cf-connecting-ip",
] as const;

export function clientIp(req: NextRequest): string {
  for (const header of IP_HEADERS) {
    const raw = req.headers.get(header);
    if (!raw) continue;
    const first = raw.split(",")[0]?.trim();
    if (first && first !== "unknown") return first;
  }
  return "unknown";
}

export function hashClientIp(req: NextRequest): string | null {
  const ip = clientIp(req);
  if (ip === "unknown") return null;
  const salt = process.env.IP_HASH_SALT ?? "cardsnap";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("hex")
    .slice(0, 32);
}
