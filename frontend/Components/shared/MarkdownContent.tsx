"use client";

import RichContent from "@/Components/content/RichContent";

/**
 * Renders AI/Markdown text as real content (headings, lists, tables, bold, code blocks, typeset maths) so
 * "###", "**" and "\\[ \\]" never show up literally. Kept as a stable import for existing callers; the
 * implementation is the shared RichContent renderer. AI text uses explicit LaTeX delimiters only.
 */
export default function MarkdownContent({
  text,
  className = "",
  legacyMath = false,
}: {
  text: string;
  className?: string;
  /** Also typeset unambiguous plain-text maths — for stored (database) content, not AI replies. */
  legacyMath?: boolean;
}) {
  return <RichContent text={text} legacyMath={legacyMath} className={className} />;
}
