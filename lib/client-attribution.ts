"use client";

import {
  ATTRIBUTION_STORAGE_KEY,
  type AttributionPayload,
  sanitizeAttribution,
} from "@/lib/attribution";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-DL4DHWG707";

function readGaClientId(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
  return match?.[1];
}

/**
 * Reads the GA4 session_id via the gtag 'get' API (async, callback-based).
 * Must only be called after window.gtag is available.
 * Returns undefined if gtag is unavailable or the call times out.
 */
function readGaSessionId(): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      resolve(undefined);
      return;
    }
    // Timeout safety: if gtag doesn't call back within 2s, give up.
    const timer = window.setTimeout(() => resolve(undefined), 2_000);
    try {
      window.gtag("get", GA_MEASUREMENT_ID, "session_id", (sessionId: unknown) => {
        window.clearTimeout(timer);
        resolve(
          typeof sessionId === "number" || typeof sessionId === "string"
            ? String(sessionId)
            : undefined
        );
      });
    } catch {
      window.clearTimeout(timer);
      resolve(undefined);
    }
  });
}

/**
 * Reads the GA4 session_id and merges it into the stored attribution payload.
 * Call this after gtag is confirmed ready (e.g., inside whenGtagReady).
 */
export async function captureGaSessionId(): Promise<void> {
  const sessionId = await readGaSessionId();
  if (!sessionId) return;
  try {
    const existing = readStoredAttribution() ?? {};
    if (existing.ga_session_id === sessionId) return; // already stored
    const updated = sanitizeAttribution({ ...existing, ga_session_id: sessionId });
    if (updated) {
      window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch {
    // localStorage unavailable — silently skip
  }
}

export function captureAttribution(): AttributionPayload | undefined {
  if (typeof window === "undefined") return undefined;

  const params = new URLSearchParams(window.location.search);
  const existing = readStoredAttribution() ?? {};
  const next: AttributionPayload = {
    ...existing,
    landing_page: existing.landing_page ?? window.location.href,
    referrer: existing.referrer ?? document.referrer,
    ga_client_id: readGaClientId() ?? existing.ga_client_id,
  };

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) next[key] = value;
  }

  const clean = sanitizeAttribution(next);
  if (clean) {
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(clean));
  }
  return clean;
}

export function readStoredAttribution(): AttributionPayload | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return sanitizeAttribution(
      JSON.parse(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY) ?? "null")
    );
  } catch {
    return undefined;
  }
}
