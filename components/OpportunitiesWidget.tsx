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

export function OpportunitiesWidget() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOpportunities(5).then((data) => {
      setOpportunities(data.opportunities || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4">Loading opportunities...</div>;

  return (
    <div className="bg-white border rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">📈 Trending Topics This Week</h2>
      <div className="space-y-3">
        {opportunities.map((opp, i) => (
          <div key={i} className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-semibold text-blue-900">{opp.opportunity}</h3>
            <p className="text-sm text-gray-600 mt-1">💡 {opp.ugc_angle}</p>
            <p className="text-xs text-gray-500 mt-2">Score: {opp.score} • Priority: {opp.priority}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Powered by real demand signals from your audience
      </p>
    </div>
  );
}
