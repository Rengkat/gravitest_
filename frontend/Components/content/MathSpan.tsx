"use client";

import { useMemo } from "react";
import katex from "katex";
import "katex/contrib/mhchem"; // adds \ce{…} (chemical formulas/equations) and \pu{…} (physical units)
import "katex/dist/katex.min.css";

/**
 * The ONE place KaTeX is configured. Every equation in the app — question text, options, explanations, AI
 * replies, grading feedback, discussions — renders through here, so the safety and accessibility settings
 * can never drift between components.
 *
 *  - trust:false          \href, \url, \includegraphics, \htmlClass… are refused: content can't inject links or markup.
 *  - throwOnError:false   a malformed expression shows as red source text; it never breaks the page.
 *  - maxExpand / maxSize  caps on macro expansion and sizes, so a hostile `\def` loop can't freeze the tab.
 *  - htmlAndMathml        KaTeX emits visual HTML (aria-hidden) PLUS real MathML for screen readers, so the
 *                         equation is exposed as structured maths rather than as stray symbols.
 */
const OPTIONS = {
  throwOnError: false,
  strict: "ignore" as const,
  trust: false,
  maxExpand: 1000,
  maxSize: 40,
  output: "htmlAndMathml" as const,
  errorColor: "#b91c1c",
};

export function renderTex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex, { ...OPTIONS, displayMode: display });
  } catch {
    // KaTeX only throws for conditions throwOnError can't soften (e.g. exceeding maxExpand).
    return "";
  }
}

interface Props {
  tex: string;
  /** Block (centred, on its own line) vs inline (flows with the text). */
  display?: boolean;
  className?: string;
}

export default function MathSpan({ tex, display = false, className = "" }: Props) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);

  if (!html) {
    // Could not typeset at all — show the source as text rather than nothing.
    return <code className="rounded bg-red-50 px-1 text-[0.9em] text-red-800">{tex}</code>;
  }
  return display ? (
    // Wide equations scroll inside their own box instead of widening the page.
    <div
      className={`my-2 max-w-full overflow-x-auto overflow-y-hidden ${className}`}
      data-math="display"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  ) : (
    <span className={className} data-math="inline" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
