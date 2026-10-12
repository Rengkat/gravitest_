"use client";

import { Shield, RefreshCw } from "lucide-react";
import { useAIData } from "../useAIData";
import { FlaggedConversations } from "../components/FlaggedConversations";
import { LoadingSpinner } from "../components/LoadingSinner";

export default function FlaggedContentPage() {
  const { flaggedSessions, loading, refreshData, unflagSession } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading flagged content..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-500 flex items-center justify-center shadow-sm">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">Flagged Content</h1>
            <p className="text-text-muted text-[13px] -mt-0.5">
              Sessions auto-flagged for policy or safety review
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

      <FlaggedConversations sessions={flaggedSessions} onUnflag={unflagSession} />
    </div>
  );
}
