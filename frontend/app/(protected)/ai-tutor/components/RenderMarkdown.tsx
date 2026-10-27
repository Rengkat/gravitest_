import React from "react";
import Link from "next/link";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

/* ─────────────────────────────────────────────────────────
   MARKDOWN RENDERER FOR TUTOR MESSAGES
   Block level : headings, paragraphs, bullet / numbered / nested lists,
                 tables, horizontal rules, fenced code, display maths
                 (\[ … \] and $$ … $$).
   Inline      : **bold**, *italic*, `code`, inline maths (\( … \) and
                 $ … $), and app-internal [links](/path).
   It also repairs the odd line breaks some models produce, e.g. a list
   marker ("1.", "•", "-") alone on a line with its text on the next one.
   Output is built as React elements (no innerHTML) except KaTeX's own
   output, so model text can never inject markup.
───────────────────────────────────────────────────────── */

/**
 * Only app-internal links are rendered as links: the target must start with a
 * single "/". A markdown link to anything else ("javascript:…", "https://…",
 * "//host") stays plain text, so model output can never plant a clickable
 * external or script URL.
 */
const INTERNAL_LINK = /^\[([^\]]+)\]\((\/(?!\/)[^)\s]*)\)$/;

const INLINE_SPLIT = new RegExp(
  "(" +
    [
      String.raw`\\\(.+?\\\)`, //                          \( inline maths \)
      String.raw`\$(?![\s\d])(?=[^$\n]*[\\^_{])[^$\n]*[^$\s]\$(?!\d)`, // $inline maths$ (can't start with a digit and must contain a maths character, so prices like $5 stay text)
      String.raw`\*\*.+?\*\*`, //                          **bold**
      String.raw`\*(?![\s*])[^*\n]*[^*\s]\*`, //          *italic*
      "`[^`\\n]+`", //                                      `code`
      String.raw`\[[^\]]+\]\([^)\s]*\)`, //                [text](/path)
    ].join("|") +
    ")",
);

/** Renders inline segments. */
function inline(text: string): React.ReactNode {
  const parts = text.split(INLINE_SPLIT);
  return parts.map((part, i) => {
    if (!part) return null;

    if (part.startsWith("\\(") && part.endsWith("\\)")) {
      return <InlineMath key={i} math={part.slice(2, -2)} />;
    }
    if (part.length > 2 && part.startsWith("$") && part.endsWith("$")) {
      return <InlineMath key={i} math={part.slice(1, -1)} />;
    }

    const link = part.match(INTERNAL_LINK);
    if (link) {
      return (
        <Link key={i} href={link[2]} className="font-semibold text-green-700 underline underline-offset-2 hover:text-green-800">
          {link[1]}
        </Link>
      );
    }

    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-green-900">
          {inline(part.slice(2, -2))}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="italic">
          {inline(part.slice(1, -1))}
        </em>
      );
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-green-800/[0.08] rounded px-1 py-px text-[0.9em] font-mono text-green-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/* ── line patterns ────────────────────────────────────── */

const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const HR = /^\s*([-*_])(\s*\1){2,}\s*$/;
const FENCE = /^\s*```/;
const LIST_ITEM = /^(\s*)([-*•]|\d+[.)])\s+(.*)$/;
const ORPHAN_MARKER = /^\s*(?:\d+[.)]|[•\-*])\s*$/;
const TABLE_ROW = /^\s*\|/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const DISPLAY_OPEN = /^\s*(\\\[|\$\$)/;

const HEADING_SIZES: Record<number, string> = {
  1: "text-[19px]",
  2: "text-[17px]",
  3: "text-[15px]",
  4: "text-[15px]",
  5: "text-[14px]",
  6: "text-[14px]",
};

function startsNewBlock(line: string): boolean {
  return (
    HEADING.test(line) ||
    HR.test(line) ||
    FENCE.test(line) ||
    TABLE_ROW.test(line) ||
    LIST_ITEM.test(line) ||
    DISPLAY_OPEN.test(line)
  );
}

/**
 * Repair model quirks before parsing: a list marker alone on a line
 * ("1.", "•", "-") gets merged with the next non-blank line.
 */
function normalize(src: string): string[] {
  const raw = src.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const out: string[] = [];
  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    if (ORPHAN_MARKER.test(line)) {
      let j = i + 1;
      while (j < raw.length && !raw[j].trim()) j++;
      if (j < raw.length && !HEADING.test(raw[j]) && !HR.test(raw[j]) && !TABLE_ROW.test(raw[j]) && !ORPHAN_MARKER.test(raw[j])) {
        out.push(`${line.trim()} ${raw[j].trim()}`);
        i = j;
        continue;
      }
    }
    out.push(line);
  }
  return out;
}

/* ── lists ────────────────────────────────────────────── */

interface Entry {
  indent: number;
  ordered: boolean;
  num: number;
  text: string;
}
interface Item {
  text: string;
  num: number;
  lists: ListData[];
}
interface ListData {
  ordered: boolean;
  start: number;
  indent: number;
  /** Nested by a heuristic (flat input), not by indentation. */
  heuristic: boolean;
  items: Item[];
}

/**
 * Builds a nested list from flat entries. Models often emit sub-points at the
 * same indentation as their parent ("2. What they need:" then "- Light …", or
 * a nested "1. 2. 3." restarting under item 3), so besides indentation we
 * nest a bullet under an ordered item and an ordered "1." restarting after
 * "2." or later.
 */
function buildList(entries: Entry[]): ListData {
  const first = entries[0];
  const root: ListData = { ordered: first.ordered, start: first.num, indent: first.indent, heuristic: false, items: [] };
  const stack: ListData[] = [root];

  const nest = (e: Entry, parent: Item, heuristic: boolean) => {
    const child: ListData = { ordered: e.ordered, start: e.num, indent: e.indent, heuristic, items: [] };
    parent.lists.push(child);
    stack.push(child);
  };

  for (const e of entries) {
    for (let guard = 0; guard < 8; guard++) {
      const top = stack[stack.length - 1];
      const last = top.items[top.items.length - 1];
      const lastNum = last ? last.num : 0;

      if (last && e.indent >= top.indent + 2) {
        nest(e, last, false);
        continue;
      }
      if (e.indent <= top.indent - 2 && stack.length > 1) {
        stack.pop();
        continue;
      }
      if (last && top.ordered && !e.ordered) {
        nest(e, last, true);
        continue;
      }
      if (last && top.ordered && e.ordered && e.num === 1 && lastNum >= 2) {
        nest(e, last, true);
        continue;
      }
      if (top.heuristic && stack.length > 1) {
        const parentList = stack[stack.length - 2];
        const parentLast = parentList.items[parentList.items.length - 1];
        const kindChanged = top.ordered !== e.ordered;
        const resumesParent = e.ordered && parentList.ordered && !!parentLast && e.num === parentLast.num + 1 && e.num !== lastNum + 1;
        if (kindChanged || resumesParent) {
          stack.pop();
          continue;
        }
      }
      top.items.push({ text: e.text, num: e.num, lists: [] });
      break;
    }
  }
  return root;
}

function renderList(list: ListData, key: React.Key): React.ReactNode {
  const items = list.items.map((it, i) => (
    <li key={i} className="pl-1 leading-relaxed">
      {inline(it.text)}
      {it.lists.map((l, j) => renderList(l, j))}
    </li>
  ));
  return list.ordered ? (
    <ol key={key} start={list.start} className="my-1 list-decimal space-y-0.5 pl-6 marker:font-bold marker:text-green-600">
      {items}
    </ol>
  ) : (
    <ul key={key} className="my-1 list-disc space-y-0.5 pl-6 marker:text-green-500">
      {items}
    </ul>
  );
}

/* ── tables ───────────────────────────────────────────── */

function splitRow(row: string): string[] {
  let r = row.trim();
  if (r.startsWith("|")) r = r.slice(1);
  if (r.endsWith("|")) r = r.slice(0, -1);
  return r.split("|").map((c) => c.trim());
}

function alignOf(cell: string): "left" | "center" | "right" {
  const c = cell.trim();
  if (c.startsWith(":") && c.endsWith(":")) return "center";
  if (c.endsWith(":")) return "right";
  return "left";
}

/* ── main ─────────────────────────────────────────────── */

export default function renderMarkdown(text: string): React.ReactNode[] {
  const lines = normalize(text);
  const nodes: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    /* Fenced code */
    if (FENCE.test(line)) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++]);
      i++; // closing fence (or end of text while streaming)
      nodes.push(
        <pre key={key++} className="my-2 overflow-x-auto rounded-xl bg-green-900/[0.06] p-3 text-[13px] leading-relaxed">
          <code className="font-mono text-green-900">{body.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    /* Display maths: \[ … \] or $$ … $$ */
    const open = line.match(DISPLAY_OPEN);
    if (open) {
      const closer = open[1] === "$$" ? "$$" : "\\]";
      const startIdx = line.indexOf(open[1]) + open[1].length;
      let buf = line.slice(startIdx);
      let closed = false;
      let j = i;
      for (;;) {
        const at = buf.indexOf(closer);
        if (at !== -1) {
          buf = buf.slice(0, at);
          closed = true;
          break;
        }
        j++;
        if (j >= lines.length) break;
        buf += "\n" + lines[j];
      }
      if (closed) {
        nodes.push(
          <div key={key++} className="my-2 overflow-x-auto">
            <BlockMath math={buf.trim()} />
          </div>,
        );
        i = j + 1;
        continue;
      }
      // Never closed (still streaming, or the model forgot): show it as text.
    }

    /* Horizontal rule */
    if (HR.test(line) && !LIST_ITEM.test(line)) {
      nodes.push(<hr key={key++} className="my-3 border-0 border-t border-green-900/15" />);
      i++;
      continue;
    }

    /* Headings */
    const heading = line.match(HEADING);
    if (heading) {
      const level = heading[1].length;
      nodes.push(
        <p key={key++} className={`font-serif ${HEADING_SIZES[level]} mt-3 mb-1 font-normal text-green-900`}>
          {inline(heading[2])}
        </p>,
      );
      i++;
      continue;
    }

    /* Tables (rows may be separated by blank lines in model output) */
    if (TABLE_ROW.test(line)) {
      const rows: string[] = [];
      let j = i;
      while (j < lines.length) {
        if (TABLE_ROW.test(lines[j])) {
          rows.push(lines[j]);
          j++;
          continue;
        }
        let k = j;
        while (k < lines.length && !lines[k].trim()) k++;
        if (k > j && k < lines.length && TABLE_ROW.test(lines[k])) {
          j = k;
          continue;
        }
        break;
      }
      if (rows.length >= 2 && TABLE_SEPARATOR.test(rows[1])) {
        const head = splitRow(rows[0]);
        const aligns = splitRow(rows[1]).map(alignOf);
        const body = rows.slice(2).map(splitRow);
        nodes.push(
          <div key={key++} className="my-2 overflow-x-auto rounded-xl border border-green-900/10">
            <table className="w-full border-collapse text-[13px]">
              <thead className="bg-green-800/[0.08]">
                <tr>
                  {head.map((c, ci) => (
                    <th key={ci} style={{ textAlign: aligns[ci] ?? "left" }} className="border-b border-green-900/10 px-3 py-2 font-bold text-green-900">
                      {inline(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((r, ri) => (
                  <tr key={ri} className="border-b border-green-900/10 last:border-b-0 align-top">
                    {head.map((_, ci) => (
                      <td key={ci} style={{ textAlign: aligns[ci] ?? "left" }} className="px-3 py-2">
                        {inline(r[ci] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        i = j;
        continue;
      }
      // Not a complete table yet (still streaming) → fall through to a paragraph.
    }

    /* Lists (items may be separated by blank lines) */
    if (LIST_ITEM.test(line)) {
      const entries: Entry[] = [];
      let j = i;
      while (j < lines.length) {
        const m = lines[j].match(LIST_ITEM);
        if (m && !HR.test(lines[j])) {
          const marker = m[2];
          const ordered = /\d/.test(marker);
          entries.push({ indent: m[1].length, ordered, num: ordered ? parseInt(marker, 10) : 0, text: m[3] });
          j++;
          continue;
        }
        let k = j;
        while (k < lines.length && !lines[k].trim()) k++;
        if (k > j && k < lines.length && LIST_ITEM.test(lines[k]) && !HR.test(lines[k])) {
          j = k;
          continue;
        }
        break;
      }
      if (entries.length > 0) {
        nodes.push(renderList(buildList(entries), key++));
        i = j;
        continue;
      }
    }

    /* Paragraph: consecutive plain lines */
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !startsNewBlock(lines[i])) para.push(lines[i++]);
    nodes.push(
      <p key={key++} className="my-1 leading-relaxed">
        {para.map((l, li) => (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {inline(l.trim())}
          </React.Fragment>
        ))}
      </p>,
    );
  }

  return nodes;
}
