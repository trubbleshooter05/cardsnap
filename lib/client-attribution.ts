"use client";

import {
  ATTRIBUTION_STORAGE_KEY,
  type AttributionPayload,
  sanitizeAttribution,
} from "@/lib/attribution";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign"] as const;

function readGaClientId(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);
  return match?.[1];
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
