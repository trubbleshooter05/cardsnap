/** Dispatched so a single AuthModal (in SiteNav) can open from upgrade flow, etc. */
export const OPEN_AUTH_EVENT = "cardsnap:open-auth";

/** Fires when the auth dialog is closed (X, overlay, or after successful submit). */
export const AUTH_MODAL_DISMISSED_EVENT = "cardsnap:auth-modal-dismissed";

export function requestOpenAuthModal(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_AUTH_EVENT));
}

export function notifyAuthModalDismissed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_DISMISSED_EVENT));
}
