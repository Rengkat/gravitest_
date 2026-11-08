"use client";

import { useMemo } from "react";
import renderMarkdown from "@/app/(protected)/ai-tutor/components/RenderMarkdown";
import { upgradeLegacyMath } from "@/lib/content/math";

interface Props {
  text: string | null | undefined;
  /** See MathText: ON for stored content (model answers, database explanations); OFF for AI/student text. */
  legacyMath?: boolean;
  className?: string;
}

/**
 * Longer content — explanations, model answers, AI replies, grading feedback — as Markdown (headings, lists,
 * tables, bold, code) with typeset maths, via the app's single Markdown renderer.
 */
export default function RichContent({ text, legacyMath = false, className = "" }: Props) {
  const nodes = useMemo(() => {
    if (!text?.trim()) return null;
    return renderMarkdown(legacyMath ? upgradeLegacyMath(text) : text);
  }, [text, legacyMath]);

  if (!nodes) return null;
  return <div className={`text-[15px] leading-7 text-gray-800 break-words ${className}`}>{nodes}</div>;
}
