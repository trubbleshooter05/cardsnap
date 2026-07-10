/** Persisted scan payload for Stripe report-checkout return (sessionStorage). */

const STORAGE_KEY = "cardsnap:pendingReportScanV1";
const TTL_MS = 30 * 60 * 1000;

/** Full /api/scan response shape stored before guest report checkout. */
export type PendingReportScan = Record<string, unknown> & {
  scanId: string;
  isPro: boolean;
};

type Stored = {
  t: number;
  data: PendingReportScan;
};

export function persistPendingReportScan(data: PendingReportScan): void {
  if (typeof window === "undefined") return;
  try {
    const payload: Stored = { t: Date.now(), data };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function readPendingReportScan(): PendingReportScan | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (
      !parsed?.data ||
      typeof parsed.t !== "number" ||
      Date.now() - parsed.t > TTL_MS
    ) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (typeof parsed.data.scanId !== "string" || !parsed.data.scanId) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function clearPendingReportScan(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
