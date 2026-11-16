"use client";

import { Fragment, useMemo } from "react";
import MathSpan from "./MathSpan";
import { splitMath, upgradeLegacyMath } from "@/lib/content/math";
import { parseMarkup } from "@/lib/content/markup";

interface Props {
  text: string | null | undefined;
  /**
   * Also typeset unambiguous plain-text maths typed before LaTeX was supported ("(5x+3)/[6x(x+1)]", "x^2").
   * ON for stored question content; OFF for AI replies and student answers/comments, which only use explicit
   * delimiters.
   */
  legacyMath?: boolean;
  /**
   * Also show the answer editor's formatting: **bold**, *italic*, __underline__. For text a student typed
   * with the editor's B / I / U buttons. Off elsewhere so ordinary asterisks are never reinterpreted.
   */
  markup?: boolean;
  className?: string;
  /** "span" (default) flows inline — right for option text and sentences. */
  as?: "span" | "div" | "p";
}

function TextWithMarkup({ value }: { value: string }) {
  return (
    <>
      {parseMarkup(value).map((t, i) =>
        t.kind === "bold" ? (
          <strong key={i}>{t.value}</strong>
        ) : t.kind === "italic" ? (
          <em key={i}>{t.value}</em>
        ) : t.kind === "underline" ? (
          <u key={i}>{t.value}</u>
        ) : (
          <Fragment key={i}>{t.value}</Fragment>
        ),
      )}
    </>
  );
}

/**
 * Short text with maths: question stems, answer options, sub-question text, a student's typed answer.
 * Preserves the author's line breaks and renders everything as React elements (never innerHTML,
 * apart from KaTeX's own output), so ordinary text stays ordinary text.
 */
export default function MathText({ text, legacyMath = true, markup = false, className = "", as: Tag = "span" }: Props) {
  const segments = useMemo(() => {
    if (!text) return [];
    return splitMath(legacyMath ? upgradeLegacyMath(text) : text);
  }, [text, legacyMath]);

  if (segments.length === 0) return null;

  return (
    <Tag className={`whitespace-pre-line break-words ${className}`}>
      {segments.map((seg, i) =>
        seg.kind === "math" ? (
          <MathSpan key={i} tex={seg.value} display={seg.display} />
        ) : markup ? (
          <TextWithMarkup key={i} value={seg.value} />
        ) : (
          <Fragment key={i}>{seg.value}</Fragment>
        ),
      )}
    </Tag>
  );
}
