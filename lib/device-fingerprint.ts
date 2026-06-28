import { createHash } from "crypto";
import type { NextRequest } from "next/server";

export function deriveDeviceFingerprint(req: NextRequest): string {
  const ua = req.headers.get("user-agent") ?? "";
  const lang = req.headers.get("accept-language") ?? "";
  const platform = req.headers.get("sec-ch-ua-platform") ?? "";
  const mobile = req.headers.get("sec-ch-ua-mobile") ?? "";
  const salt = process.env.DEVICE_FP_SALT ?? process.env.IP_HASH_SALT ?? "cardsnap";
  return createHash("sha256")
    .update(`${salt}:device:${ua}|${lang}|${platform}|${mobile}`)
    .digest("hex")
    .slice(0, 32);
}
