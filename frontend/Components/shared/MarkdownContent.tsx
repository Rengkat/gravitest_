"use client";

import renderMarkdown from "@/app/(protected)/ai-tutor/components/RenderMarkdown";

/**
 * Renders AI/Markdown text as real content (headings, lists, tables, bold,
 * code blocks, KaTeX maths) using the app's existing Markdown renderer, so
 * "###", "**" and "\[ \]" never show up literally. Plain text with line
 * breaks and paragraphs is preserved.
 */
export default function MarkdownContent({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`text-[15px] leading-7 text-gray-800 break-words ${className}`}>
      {renderMarkdown(text)}
    </div>
  );
}
