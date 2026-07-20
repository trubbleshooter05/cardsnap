"use client";

import { useEffect } from "react";

// ConversionEvent retains the full shape so future UI (success toast, redirect
// logic) can read productType, plan, packCredits without changes to this file.
type ConversionEvent = {
  productType: "subscription" | "scan_pack" | "report";
  transactionId: string;
  plan?: string;
  packCredits?: number;
};

function conversionFromSearch(search: string): ConversionEvent | null {
  const params = new URLSearchParams(search);
  const sessionId = params.get("checkout_session_id") ?? "";

  if (params.get("upgraded") === "1") {
    const plan = params.get("plan") === "monthly" ? "monthly" : "annual";
    return {
      productType: "subscription",
      transactionId: sessionId || `subscription-${plan}`,
      plan,
    };
  }

  if (params.get("pack_purchase") === "1") {
    const credits = params.get("credits") ?? "10";
    return {
      productType: "scan_pack",
      transactionId: sessionId || `scan-pack-${credits}`,
      packCredits: Number(credits),
    };
  }

  if (params.get("report") === "success") {
    return {
      productType: "report",
      transactionId: sessionId || "single-report",
    };
  }

  return null;
}

/**
 * Detects Stripe success return URLs.
 *
 * GA4 purchase, subscription_started, and checkout_completed events are sent
 * exclusively by the Stripe webhook via GA4 Measurement Protocol
 * (lib/ga4-measurement-protocol.ts). This component deliberately does NOT fire
 * any GA4 revenue events to prevent double-counting.
 *
 * The conversion detection and ConversionEvent shape are retained so that
 * future UI work (success toasts, redirects, post-purchase flows) can hook
 * in here without touching the analytics layer.
 */
export function ConversionTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const conversion = conversionFromSearch(window.location.search);
    if (!conversion) return;
    // Conversion return detected. UI work (toasts, redirects) goes here.
    // Do NOT fire window.gtag purchase events — those are sent server-side.
    console.log("[cardsnap:conversion] success return", {
      productType: conversion.productType,
      transactionId: conversion.transactionId,
    });
  }, []);

  return null;
}
