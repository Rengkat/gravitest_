/**
 * Helpers for the answer editor's "Insert equation" feature. Pure functions: no DOM, no React.
 *
 * Equations live inside the student's text as  \( … \)  (inline)  or  \[ … \]  (own line) — the same
 * delimiters the AI and the results page use, so what the student builds renders everywhere.
 */

import { splitMath } from "./math";

/** The empty box a template leaves for the student to fill in (renders as a visible square). */
export const PLACEHOLDER = "\\square";

export interface EquationSpan {
  /** Index of the first character of the whole equation, delimiters included. */
  start: number;
  /** Index just past the last character, delimiters included. */
  end: number;
  tex: string;
  display: boolean;
}

/** Every equation in a piece of text, with its exact position. */
export function findEquations(text: string): EquationSpan[] {
  const spans: EquationSpan[] = [];
  let pos = 0;
  for (const seg of splitMath(text)) {
    if (seg.kind === "text") {
      pos += seg.value.length;
      continue;
    }
    // splitMath trims the maths, so locate the real delimited span in the source.
    const rest = text.slice(pos);
    const m = rest.match(/^(\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$\$[\s\S]+?\$\$|\$(?!\s)[^$\n]*?[^$\s]\$)/);
    if (m) {
      spans.push({ start: pos, end: pos + m[0].length, tex: seg.value, display: seg.display });
      pos += m[0].length;
    }
  }
  return spans;
}

/**
 * The equation the caret (or selection) sits inside, if any — so the toolbar can offer "Edit equation"
 * instead of nesting a new equation inside an old one.
 */
export function findEquationAt(text: string, selStart: number, selEnd: number = selStart): EquationSpan | null {
  return findEquations(text).find((s) => selStart >= s.start && selEnd <= s.end) ?? null;
}

/** How to write an equation into the answer text. Display equations get their own line. */
export function formatEquation(tex: string, display: boolean): string {
  const body = tex.trim();
  return display ? `\n\\[${body}\\]\n` : `\\(${body}\\)`;
}

/** Replace [start, end) of `text` with `insert`, and say where the caret should land. */
export function spliceText(text: string, start: number, end: number, insert: string) {
  return { text: text.slice(0, start) + insert + text.slice(end), caret: start + insert.length };
}

/** Index of the next / previous empty box at or after / before `from`, or -1. */
export function nextPlaceholder(tex: string, from: number): number {
  return tex.indexOf(PLACEHOLDER, from);
}
export function previousPlaceholder(tex: string, before: number): number {
  return before <= 0 ? -1 : tex.lastIndexOf(PLACEHOLDER, before - 1);
}

/**
 * Put a template into the equation at the selection.
 *  - If text is selected and the template has a box, the selection fills the FIRST box (like Word wrapping
 *    the selection in a fraction).
 *  - The caret then lands on the first remaining empty box, or at the end of the template if none.
 */
export function applyTemplate(
  tex: string,
  selStart: number,
  selEnd: number,
  template: string,
): { tex: string; selStart: number; selEnd: number } {
  const selected = tex.slice(selStart, selEnd);
  const filled = selected ? template.replace(PLACEHOLDER, selected) : template;
  const next = tex.slice(0, selStart) + filled + tex.slice(selEnd);
  const box = nextPlaceholder(next, selStart);
  if (box !== -1 && box < selStart + filled.length) {
    return { tex: next, selStart: box, selEnd: box + PLACEHOLDER.length };
  }
  const caret = selStart + filled.length;
  return { tex: next, selStart: caret, selEnd: caret };
}

export function countEmptyBoxes(tex: string): number {
  return tex.split(PLACEHOLDER).length - 1;
}

/** Templates that need a size from the student. */
export function matrixTemplate(rows: number, cols: number, kind: "pmatrix" | "bmatrix" | "vmatrix"): string {
  const r = Math.min(6, Math.max(1, Math.floor(rows)));
  const c = Math.min(6, Math.max(1, Math.floor(cols)));
  const row = Array.from({ length: c }, () => PLACEHOLDER).join(" & ");
  return `\\begin{${kind}}${Array.from({ length: r }, () => row).join(" \\\\ ")}\\end{${kind}}`;
}

export function systemTemplate(equations: number, kind: "cases" | "aligned"): string {
  const n = Math.min(5, Math.max(2, Math.floor(equations)));
  const line = kind === "aligned" ? `${PLACEHOLDER} &= ${PLACEHOLDER}` : PLACEHOLDER;
  return `\\begin{${kind}}${Array.from({ length: n }, () => line).join(" \\\\ ")}\\end{${kind}}`;
}
