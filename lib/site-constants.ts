/** Editorial line shown on public pages (E-E-A-T / transparency). */
export const EDITORIAL_BYLINE = "CardSnap Research Team";

/**
 * Last substantive review of on-site methodology copy and tool behavior description.
 * Update when methodology, pricing logic description, or legal pages materially change.
 */
export const CONTENT_LAST_REVIEWED_ISO = "2026-04-11";

export function formatContentUpdatedLong(isoDate: string = CONTENT_LAST_REVIEWED_ISO): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}
