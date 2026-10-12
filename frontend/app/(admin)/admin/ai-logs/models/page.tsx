"use client";

import { Brain } from "lucide-react";
import { useAIData } from "../useAIData";
import { AIModelSelector } from "../components/AIModelSelector";
import { LoadingSpinner } from "../components/LoadingSinner";

export default function ModelManagementPage() {
  const { loading, updateModelConfig } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading model configuration..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-500 flex items-center justify-center shadow-sm">
          <Brain size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-green-900">Model Management</h1>
          <p className="text-text-muted text-[13px] -mt-0.5">
            Choose which AI model powers each feature
          </p>
        </div>
      </div>

      <AIModelSelector onUpdate={updateModelConfig} />
    </div>
  );
}
