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
 * quotes, tables, bold, code) with typeset maths, via the app's single Markdown renderer, in its roomy
 * "spacious" layout so worked solutions are comfortable to read.
 */
export default function RichContent({ text, legacyMath = false, className = "" }: Props) {
  const nodes = useMemo(() => {
    if (!text?.trim()) return null;
    return renderMarkdown(legacyMath ? upgradeLegacyMath(text) : text, { spacious: true });
  }, [text, legacyMath]);

  if (!nodes) return null;
  return (
    <div
      className={`break-words text-[15px] leading-7 text-gray-800 [&>*:first-child]:!mt-0 [&>*:last-child]:!mb-0 ${className}`}>
      {nodes}
    </div>
  );
}
