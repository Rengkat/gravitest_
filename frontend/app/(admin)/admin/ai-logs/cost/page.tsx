"use client";

import { DollarSign, RefreshCw } from "lucide-react";
import { useAIData } from "../useAIData";
import { AICostAnalytics } from "../components/AICostAnalytics";
import { LoadingSpinner } from "../components/LoadingSinner";

export default function CostAnalyticsPage() {
  const { costStats, loading, refreshData } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading cost analytics..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-500 flex items-center justify-center shadow-sm">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">Cost Analytics</h1>
            <p className="text-text-muted text-[13px] -mt-0.5">
              Token usage and spend across AI features
            </p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-cream transition-all text-[13px]">
          <RefreshCw size={14} className="text-text-muted" />
          <span className="text-text-muted">Refresh</span>
        </button>
      </div>

      {costStats ? (
        <AICostAnalytics stats={costStats} />
      ) : (
        <div
          className="bg-white rounded-xl border p-12 text-center text-text-muted"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          No cost data available.
        </div>
      )}
    </div>
  );
}
