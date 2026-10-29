"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import AiExplainModal, { type ExplainCache } from "./AiExplainModal";

interface ExplainWithAiButtonProps {
  /** The question (or part) this button belongs to — shown as context in the dialog. */
  questionText: string;
  /** Bound to THIS question only: carries its id, the student's answer, etc. */
  request: () => Promise<string>;
  label?: string;
  className?: string;
}

/**
 * Self-contained "Explain more with AI" control. Each instance owns its own
 * open state and cached results, so every question / sub-question is fully
 * independent — opening one can never open, close or overwrite another.
 */
export default function ExplainWithAiButton({
  questionText,
  request,
  label = "Explain with Sabi",
  className,
}: ExplainWithAiButtonProps) {
  const [open, setOpen] = useState(false);
  const cache = useRef<ExplainCache>({});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-lg border border-green-700 bg-green-50 px-3 py-1.5 text-[13px] font-semibold text-green-900 hover:bg-green-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700"
        }>
        <Sparkles size={14} aria-hidden="true" />
        {label}
      </button>
      {open && (
        <AiExplainModal
          questionText={questionText}
          request={request}
          cache={cache.current}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
