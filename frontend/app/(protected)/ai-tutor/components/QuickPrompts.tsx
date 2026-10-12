"use client";

import { QUICK_PROMPTS } from "@/lib/mock/ai-tutor";

interface QuickPromptsProps {
  onSelect: (prompt: string) => void;
}

export default function QuickPrompts({ onSelect }: QuickPromptsProps) {
  return (
    <div
      role="toolbar"
      aria-label="Quick prompt suggestions"
      className="px-5 pt-2.5 pb-0 border-t border-green-500/[0.08] bg-white flex gap-1.5 overflow-x-auto shrink-0">
      {QUICK_PROMPTS.map((q, i) => {
        const Icon = q.icon;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(q.prompt)}
            aria-label={`Quick prompt: ${q.label}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-800/[0.06] border border-green-500/[0.12] text-[12px] font-semibold text-green-600 whitespace-nowrap cursor-pointer shrink-0 hover:bg-green-800/[0.12] hover:border-green-500/[0.2] transition-all focus-visible:outline-2 focus-visible:outline-green-500">
            <Icon size={12} aria-hidden="true" />
            {q.label}
          </button>
        );
      })}
    </div>
  );
}
