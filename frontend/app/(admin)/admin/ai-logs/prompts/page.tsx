"use client";

import { Sparkles } from "lucide-react";
import { useAIData } from "../useAIData";
import { SystemPromptEditor } from "../components/SystemPromptEditor";
import { LoadingSpinner } from "../components/LoadingSinner";

export default function SystemPromptsPage() {
  const { loading, updateSystemPrompt } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading system prompts..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-green-500 flex items-center justify-center shadow-sm">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-green-900">System Prompts</h1>
          <p className="text-text-muted text-[13px] -mt-0.5">
            Configure the base instructions for each AI feature
          </p>
        </div>
      </div>

      <SystemPromptEditor onSave={updateSystemPrompt} />
    </div>
  );
}
