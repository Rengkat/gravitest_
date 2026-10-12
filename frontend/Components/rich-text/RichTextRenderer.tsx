"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

// For tight-space previews (cards, list rows) where multi-<p> HTML would
// break CSS line-clamp — strips tags entirely rather than truncating raw
// HTML mid-tag.
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  const div = document.createElement("div");
  div.innerHTML = clean;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}

interface RichTextRendererProps {
  html: string;
  className?: string;
}

// Renders HTML produced by RichTextEditor (via @lexical/html's
// $generateHtmlFromNodes). Deliberately NOT a full read-only Lexical
// instance — that would mean shipping the whole editor runtime just to
// display static content. Sanitizing with DOMPurify before render is the
// actual XSS boundary here: this content originates from admin input and
// could contain anything if the editor's own escaping were ever bypassed
// (browser extensions, a future paste-handler bug, hand-edited HTML sent
// straight to the API, etc.) — never skip this step.
export function RichTextRenderer({ html, className = "" }: RichTextRendererProps) {  const clean = useMemo(() => {
    if (typeof window === "undefined") return ""; // DOMPurify needs a DOM; SSR pass renders empty, hydrates on client
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
        "h1", "h2", "h3", "blockquote", "span",
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });
  }, [html]);

  if (!html?.trim()) return null;

  return (
    <div
      className={`text-[14px] text-gray-700 leading-relaxed [&_a]:text-green-700 [&_a]:underline [&_ul]:list-disc [&_ul]:list-inside [&_ol]:list-decimal [&_ol]:list-inside [&_blockquote]:border-l-4 [&_blockquote]:border-green-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:text-base [&_h3]:font-bold [&_p]:mb-2 [&_p:last-child]:mb-0 ${className}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
