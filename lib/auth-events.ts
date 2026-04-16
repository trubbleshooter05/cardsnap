/** Dispatched so a single AuthModal (in SiteNav) can open from upgrade flow, etc. */
export const OPEN_AUTH_EVENT = "cardsnap:open-auth";

export function requestOpenAuthModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_AUTH_EVENT));
}
