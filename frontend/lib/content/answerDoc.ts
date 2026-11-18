/**
 * The typed-answer editor is WYSIWYG, but what it STORES (and sends to the server / the AI marker / the results
 * page) is still the plain-text format the app already understands:
 *
 *     **bold**   *italic*   __underline__   \( inline maths \)   \[ display maths \]   "\n" between lines
 *
 * These pure functions convert between that text and a small document model the editor can load and save.
 * No DOM, no React, no Lexical — so the round trip is easy to test and the stored format can't drift.
 *
 * A run carries AT MOST ONE of bold / italic / underline: the text format has no nesting
 * (see markup.ts), so the editor makes the three buttons mutually exclusive rather than save formatting that
 * could not be shown again.
 */

import { splitMath } from "./math";
import { parseMarkup } from "./markup";

export type TextFormat = "bold" | "italic" | "underline";

export type AnswerRun =
  | { kind: "text"; text: string; format: TextFormat | null }
  | { kind: "math"; tex: string; display: boolean };

/** One entry per line of the answer. */
export type AnswerDoc = AnswerRun[][];

const MARKER: Record<TextFormat, string> = { bold: "**", italic: "*", underline: "__" };

/** When a run somehow carries several formats (e.g. pasted rich text), keep the strongest one. */
export function pickFormat(f: { bold?: boolean; italic?: boolean; underline?: boolean }): TextFormat | null {
  return f.bold ? "bold" : f.italic ? "italic" : f.underline ? "underline" : null;
}

/** Stored text → document. Mirrors exactly how MathText + parseMarkup DISPLAY the same text. */
export function parseAnswer(text: string | null | undefined): AnswerDoc {
  const doc: AnswerDoc = [[]];
  if (!text) return doc;
  const line = () => doc[doc.length - 1];

  for (const seg of splitMath(text)) {
    if (seg.kind === "math") {
      line().push({ kind: "math", tex: seg.value, display: seg.display });
      continue;
    }
    seg.value.split("\n").forEach((piece, i) => {
      if (i > 0) doc.push([]);
      for (const tok of parseMarkup(piece)) {
        line().push({
          kind: "text",
          text: tok.value,
          format: tok.kind === "text" ? null : tok.kind,
        });
      }
    });
  }
  return doc;
}

function serializeText(text: string, format: TextFormat | null): string {
  if (!format || !text) return text;
  // The format markers only count when text hugs them on the inside, so spaces stay outside.
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m || !m[2]) return text;
  const mark = MARKER[format];
  return `${m[1]}${mark}${m[2]}${mark}${m[3]}`;
}

/** Document → stored text. */
export function serializeAnswer(doc: AnswerDoc): string {
  const lines = doc.map((runs) =>
    runs
      .map((r) => {
        if (r.kind === "text") return serializeText(r.text, r.format);
        const tex = r.tex.trim();
        if (!tex) return "";
        return r.display ? `\\[${tex}\\]` : `\\(${tex}\\)`;
      })
      .join(""),
  );
  // Trailing empty lines are just the caret resting below the text — never part of the answer.
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines.join("\n");
}

/** Round-trips text through the model; stored text that is already canonical comes back unchanged. */
export function normalizeAnswer(text: string): string {
  return serializeAnswer(parseAnswer(text));
}
