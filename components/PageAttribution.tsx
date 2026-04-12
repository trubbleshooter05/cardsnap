"use client";

import {
  CONTENT_LAST_REVIEWED_ISO,
  EDITORIAL_BYLINE,
  formatContentUpdatedLong,
} from "@/lib/site-constants";

type PageAttributionProps = {
  className?: string;
  /** ISO date (YYYY-MM-DD); defaults to site-wide review date */
  updatedIso?: string;
};

export function PageAttribution({
  className = "",
  updatedIso = CONTENT_LAST_REVIEWED_ISO,
}: PageAttributionProps) {
  return (
    <p
      className={`text-xs text-zinc-500 ${className}`.trim()}
      data-updated={updatedIso}
    >
      <span className="text-zinc-400">{EDITORIAL_BYLINE}</span>
      <span className="mx-2 text-zinc-600" aria-hidden>
        ·
      </span>
      <time dateTime={updatedIso}>
        Updated {formatContentUpdatedLong(updatedIso)}
      </time>
    </p>
  );
}
