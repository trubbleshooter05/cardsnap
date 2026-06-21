"use client";

import { useEffect } from "react";
import { trackCheckoutCompleted } from "@/lib/ga4-funnel";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

type ConversionEvent = {
  eventName: "purchase" | "subscription_started";
  transactionId: string;
  value: number;
  itemName: string;
  itemId: string;
  productType: "subscription" | "scan_pack" | "report";
  plan?: string;
  packCredits?: number;
};

const CURRENCY = "USD";

const PACK_VALUES: Record<string, number> = {
  "10": 9.99,
  "50": 29,
  "200": 79,
};

function conversionFromSearch(search: string): ConversionEvent | null {
  const params = new URLSearchParams(search);
  const sessionId = params.get("checkout_session_id") ?? "";

  if (params.get("upgraded") === "1") {
    const plan = params.get("plan") === "monthly" ? "monthly" : "annual";
    return {
      eventName: "subscription_started",
      transactionId: sessionId || `subscription-${plan}`,
      value: plan === "monthly" ? 9.99 : 99,
      itemName: `CardSnap Pro ${plan}`,
      itemId: `cardsnap_pro_${plan}`,
      productType: "subscription",
      plan,
    };
  }

  if (params.get("pack_purchase") === "1") {
    const credits = params.get("credits") ?? "10";
    return {
      eventName: "purchase",
      transactionId: sessionId || `scan-pack-${credits}`,
      value: PACK_VALUES[credits] ?? 0,
      itemName: `CardSnap ${credits} scan pack`,
      itemId: `cardsnap_scan_pack_${credits}`,
      productType: "scan_pack",
      packCredits: Number(credits),
    };
  }

  if (params.get("report") === "success") {
    return {
      eventName: "purchase",
      transactionId: sessionId || "single-report",
      value: 4.99,
      itemName: "CardSnap single grading report",
      itemId: "cardsnap_single_report",
      productType: "report",
    };
  }

  return null;
}

export function ConversionTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const conversion = conversionFromSearch(window.location.search);
    if (!conversion || typeof window.gtag !== "function") return;

    const storageKey = `cardsnap:ga4:conversion:${conversion.transactionId}`;
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(storageKey, "1");

    window.gtag("event", conversion.eventName, {
      transaction_id: conversion.transactionId,
      value: conversion.value,
      currency: CURRENCY,
      items: [
        {
          item_name: conversion.itemName,
          item_id: conversion.itemId,
          quantity: 1,
        },
      ],
    });

    trackCheckoutCompleted({
      transaction_id: conversion.transactionId,
      value: conversion.value,
      product_type: conversion.productType,
      plan: conversion.plan,
      pack_credits: conversion.packCredits,
    });
  }, []);

  return null;
}
