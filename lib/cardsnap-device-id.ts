/** Device-scoped id for free-scan limits (persists across login in the same browser profile). */

export const CARDSNAP_DEVICE_COOKIE = "cardsnap_device_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidDeviceId(s: string | undefined | null): s is string {
  return Boolean(s && UUID_RE.test(s));
}
