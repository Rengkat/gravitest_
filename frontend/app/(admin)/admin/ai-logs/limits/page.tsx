"use client";

import { Clock } from "lucide-react";
import { useAIData } from "../useAIData";
import { RateLimitControls } from "../components/RateLimitControls";
import { LoadingSpinner } from "../components/LoadingSinner";

export default function RateLimitsPage() {
  const { loading, updateRateLimits } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading rate limit settings..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center shadow-sm">
          <Clock size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-green-900">Rate Limits</h1>
          <p className="text-text-muted text-[13px] -mt-0.5">
            Control request limits per user and feature
          </p>
        </div>
      </div>

      <RateLimitControls onUpdate={updateRateLimits} />
    </div>
  );
}
