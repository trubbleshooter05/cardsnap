const DEFAULT_MAX_MS = 10_000;
const POLL_MS = 50;

/** Run fn once window.gtag exists (afterInteractive GA scripts). */
export function whenGtagReady(fn: () => void, maxMs = DEFAULT_MAX_MS): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    fn();
    return;
  }

  const started = Date.now();
  const timer = window.setInterval(() => {
    if (typeof window.gtag === "function") {
      window.clearInterval(timer);
      fn();
      return;
    }
    if (Date.now() - started >= maxMs) {
      window.clearInterval(timer);
      if (process.env.NODE_ENV === "development") {
        console.warn("[ga4] gtag not ready before timeout");
      }
    }
  }, POLL_MS);
}
