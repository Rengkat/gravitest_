"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useAIData } from "../useAIData";
import { AIPerformanceMonitor } from "../components/AIPerformanceMonitor";
import { LoadingSpinner } from "../components/LoadingSinner";

export default function PerformancePage() {
  const { performanceStats, loading, refreshData } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading performance data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-sm">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">Performance</h1>
            <p className="text-text-muted text-[13px] -mt-0.5">
              Response times, success rates, and reliability
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

      {performanceStats ? (
        <AIPerformanceMonitor stats={performanceStats} />
      ) : (
        <div
          className="bg-white rounded-xl border p-12 text-center text-text-muted"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          No performance data available.
        </div>
      )}
    </div>
  );
}
