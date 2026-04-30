/** Editorial line shown on public pages (E-E-A-T / transparency). */
export const EDITORIAL_BYLINE = "CardSnap Research Team";

/**
 * Last substantive review of on-site methodology copy and tool behavior description.
 * Update when methodology, pricing logic description, or legal pages materially change.
 */
export const CONTENT_LAST_REVIEWED_ISO = "2026-04-11";

export function formatContentUpdatedLong(isoDate: string = CONTENT_LAST_REVIEWED_ISO): string {
  const normalized = isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00Z`;
  const d = new Date(normalized);
  const safeDate = Number.isNaN(d.getTime())
    ? new Date(`${CONTENT_LAST_REVIEWED_ISO}T12:00:00Z`)
    : d;

  return safeDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
