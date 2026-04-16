/** Shared anonymous user id validation (matches cookie + client storage). */

export const CARDSNAP_USER_COOKIE = "cardsnap_user_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUserId(s: string | undefined | null): s is string {
  return Boolean(s && UUID_RE.test(s));
}
