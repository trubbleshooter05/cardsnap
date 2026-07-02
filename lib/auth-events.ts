/** Dispatched so a single AuthModal (in SiteNav) can open from upgrade flow, etc. */
export const OPEN_AUTH_EVENT = "cardsnap:open-auth";

/** Fires when the auth dialog is closed (X, overlay, or after successful submit). */
export const AUTH_MODAL_DISMISSED_EVENT = "cardsnap:auth-modal-dismissed";

export type AuthModalMode = "signin" | "signup";

export function requestOpenAuthModal(mode: AuthModalMode = "signin"): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_AUTH_EVENT, { detail: { mode } }));
}

export function notifyAuthModalDismissed(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_DISMISSED_EVENT));
}
