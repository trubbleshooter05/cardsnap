"use client";

import { useEffect } from "react";
import { captureAttribution, captureGaSessionId } from "@/lib/client-attribution";
import { whenGtagReady } from "@/lib/gtag-ready";

export function AttributionTracker() {
  useEffect(() => {
    // Sync capture: UTMs, referrer, landing_page, ga_client_id from _ga cookie.
    captureAttribution();
    // Async capture: ga_session_id via gtag('get') — only available after GA4
    // scripts load. whenGtagReady polls until window.gtag exists, then fires.
    whenGtagReady(() => {
      void captureGaSessionId();
    });
  }, []);

  return null;
}
