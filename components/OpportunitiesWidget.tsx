"use client";

import { useEffect, useState } from "react";
import { getOpportunities } from "@/lib/insights";

interface Opportunity {
  opportunity: string;
  score: number;
  ugc_angle: string;
  next_action: string;
  priority: string;
}

function normalizeOpportunity(raw: unknown): Opportunity | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const opportunity =
    typeof o.opportunity === "string"
      ? o.opportunity
      : typeof o.title === "string"
        ? o.title
        : null;
  if (!opportunity) return null;
  return {
    opportunity,
    score: typeof o.score === "number" ? o.score : Number(o.score) || 0,
    ugc_angle:
      typeof o.ugc_angle === "string"
        ? o.ugc_angle
        : typeof o.angle === "string"
          ? o.angle
          : "",
    next_action:
      typeof o.next_action === "string"
        ? o.next_action
        : typeof o.nextAction === "string"
          ? o.nextAction
          : "",
    priority:
      typeof o.priority === "string" ? o.priority : String(o.priority ?? "—"),
  };
}

export function OpportunitiesWidget() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getOpportunities(5)
      .then((data) => {
        if (cancelled) return;
        const raw = Array.isArray(data?.opportunities) ? data.opportunities : [];
        const normalized = raw
          .map(normalizeOpportunity)
          .filter((x): x is Opportunity => x != null);
        setOpportunities(normalized);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto mt-12 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-sm text-zinc-400">
        Loading trending topics…
      </div>
    );
  }

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto mt-12 w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-xl">
      <h2 className="text-lg font-bold text-white">
        📈 Trending Topics This Week
      </h2>
      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-amber-500/90">
        Ideas for grading & ROI content
      </p>
      <div className="mt-5 space-y-4">
        {opportunities.map((opp, i) => (
          <div
            key={`${opp.opportunity}-${i}`}
            className="border-l-4 border-amber-500/70 pl-4"
          >
            <h3 className="font-semibold leading-snug text-zinc-100">
              {opp.opportunity}
            </h3>
            {opp.ugc_angle ? (
              <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                💡 {opp.ugc_angle}
              </p>
            ) : null}
            <p className="mt-2 text-xs text-zinc-500">
              Score: {opp.score} • Priority: {opp.priority}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
        Powered by real demand signals from your audience.{" "}
        <span className="text-zinc-600">
          (Live feed when Insights API is connected.)
        </span>
      </p>
    </div>
  );
}
