import { CARDSNAP_USER_COOKIE } from "@/lib/cardsnap-user-id";

const STORAGE_KEY = CARDSNAP_USER_COOKIE;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function isValidUuid(s: string | null | undefined): s is string {
  return Boolean(s && UUID_RE.test(s));
}

function readLocal(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readSession(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const escaped = STORAGE_KEY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${escaped}=([^;]*)`));
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1].trim());
  } catch {
    return m[1].trim();
  }
}

/** Write ID to every storage backend so mobile Safari / private mode still persist across refresh. */
export function persistAnonymousId(id: string): void {
  if (!isValidUuid(id)) return;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* quota / disabled */
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* quota / disabled */
  }
  try {
    const secure =
      typeof location !== "undefined" && location.protocol === "https:";
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(
      id
    )}; path=/; max-age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`;
  } catch {
    /* cookies disabled */
  }
}

export function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "";

  const fromLocal = readLocal();
  if (isValidUuid(fromLocal)) {
    persistAnonymousId(fromLocal);
    return fromLocal;
  }

  const fromSession = readSession();
  if (isValidUuid(fromSession)) {
    persistAnonymousId(fromSession);
    return fromSession;
  }

  const fromCookie = readCookie();
  if (isValidUuid(fromCookie)) {
    persistAnonymousId(fromCookie);
    return fromCookie;
  }

  const id = generateUUID();
  persistAnonymousId(id);
  return id;
}
