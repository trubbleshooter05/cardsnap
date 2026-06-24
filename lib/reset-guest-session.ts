import { CARDSNAP_USER_COOKIE } from "@/lib/cardsnap-user-id";
import { CARDSNAP_DEVICE_COOKIE } from "@/lib/cardsnap-device-id";

/** Clear anonymous scan identity cookies/storage (fixes ghost "Pro" from stale browser ids). */
export function resetGuestSession(): void {
  const keys = [CARDSNAP_USER_COOKIE, CARDSNAP_DEVICE_COOKIE];
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    try {
      document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }
  window.location.href = "/";
}
