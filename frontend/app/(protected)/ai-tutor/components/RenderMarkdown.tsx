import React from "react";
import Link from "next/link";

/* ─────────────────────────────────────────────────────────
   SIMPLE MARKDOWN RENDERER
   Handles: **bold**, `code`, [text](/internal-path) links,
   bullet lists, numbered lists, headings (#, ##, ###), and
   paragraph breaks.
   No external dependency needed.
───────────────────────────────────────────────────────── */

/**
 * Only app-internal links are rendered as links: the target must start with a
 * single "/". A markdown link to anything else ("javascript:…", "https://…",
 * "//host") stays plain text, so model output can never plant a clickable
 * external or script URL.
 */
const INTERNAL_LINK = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/;

/** Renders inline segments: **bold**, `code` and internal [links](/path) */
function inlineRender(line: string): React.ReactNode {
  const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]*\))/);
  return parts.map((part, i) => {
    const link = part.match(INTERNAL_LINK);
    if (link) {
      return (
        <Link key={i} href={link[2]} className="font-semibold text-green-700 underline underline-offset-2 hover:text-green-800">
          {link[1]}
        </Link>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-green-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="bg-green-800/[0.08] rounded px-1 py-px text-[0.9em] font-mono text-green-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

const HEADING_SIZES: Record<number, string> = {
  1: "text-[19px]",
  2: "text-[17px]",
  3: "text-[15px]",
};

export default function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (!line.trim()) {
      nodes.push(<div key={key++} className="h-2" />);
      continue;
    }

    /* Headings */
    const headingMatch = line.match(/^(#{1,3}) (.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const sizeClass = HEADING_SIZES[level] ?? "text-[15px]";
      nodes.push(
        <p key={key++} className={`font-serif ${sizeClass} text-green-900 font-normal mt-3 mb-1`}>
          {inlineRender(headingMatch[2])}
        </p>,
      );
      continue;
    }

    /* Bullet list */
    if (/^[•\-*] /.test(line)) {
      nodes.push(
        <div key={key++} className="flex gap-2 my-0.5 items-start">
          <span className="text-green-500 font-bold mt-px shrink-0" aria-hidden="true">
            •
          </span>
          <span>{inlineRender(line.slice(2))}</span>
        </div>,
      );
      continue;
    }

    /* Numbered list */
    const numMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numMatch) {
      nodes.push(
        <div key={key++} className="flex gap-2 my-0.5 items-start">
          <span className="text-green-500 font-bold mt-px shrink-0 min-w-[18px]" aria-hidden="true">
            {numMatch[1]}.
          </span>
          <span>{inlineRender(numMatch[2])}</span>
        </div>,
      );
      continue;
    }

    /* Regular paragraph */
    nodes.push(
      <p key={key++} className="my-0.5 leading-relaxed">
        {inlineRender(line)}
      </p>,
    );
  }

  return nodes;
}
