export const ATTRIBUTION_STORAGE_KEY = "cardsnap:attribution:v1";

export type AttributionPayload = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  landing_page?: string;
  referrer?: string;
  ga_client_id?: string;
  ga_session_id?: string;
};

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "landing_page",
  "referrer",
  "ga_client_id",
  "ga_session_id",
] as const;

const MAX_ATTRIBUTION_VALUE_LENGTH = 500;

export function sanitizeAttribution(
  input: unknown
): AttributionPayload | undefined {
  if (!input || typeof input !== "object") return undefined;

  const out: AttributionPayload = {};
  const raw = input as Record<string, unknown>;

  for (const key of ATTRIBUTION_KEYS) {
    const value = raw[key];
    if (typeof value !== "string") continue;
    const clean = value.trim().slice(0, MAX_ATTRIBUTION_VALUE_LENGTH);
    if (clean) out[key] = clean;
  }

  return Object.keys(out).length ? out : undefined;
}

export function attributionToStripeMetadata(
  attribution: AttributionPayload | undefined
): Record<string, string> {
  if (!attribution) return {};
  return Object.fromEntries(
    Object.entries(attribution).map(([key, value]) => [`attr_${key}`, value])
  );
}
