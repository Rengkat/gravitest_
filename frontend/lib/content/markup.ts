/**
 * The answer editor's B / I / U buttons wrap the selection in ** … **, * … * and __ … __.
 * This turns those markers back into formatting when an answer is DISPLAYED.
 *
 * Deliberately narrow so ordinary typing is never mangled: a marker only counts when text hugs it on the
 * inside (no space after the opener, none before the closer) and the markers are properly paired — so
 * "2 * 3 * 4", "a*b" and "snake__case" stay exactly as written.
 */

export type MarkupToken =
  | { kind: "text"; value: string }
  | { kind: "bold" | "italic" | "underline"; value: string };

const PATTERNS: { kind: MarkupToken["kind"]; re: RegExp }[] = [
  { kind: "bold", re: /\*\*(?=\S)([^*\n]*?\S)\*\*/g },
  { kind: "underline", re: /(?<![A-Za-z0-9_])__(?=\S)([^_\n]*?\S)__(?![A-Za-z0-9_])/g },
  { kind: "italic", re: /(?<![A-Za-z0-9*])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![A-Za-z0-9*])/g },
];

export function parseMarkup(text: string): MarkupToken[] {
  let tokens: MarkupToken[] = [{ kind: "text", value: text }];
  for (const { kind, re } of PATTERNS) {
    const next: MarkupToken[] = [];
    for (const tok of tokens) {
      if (tok.kind !== "text") {
        next.push(tok);
        continue;
      }
      let last = 0;
      for (const m of tok.value.matchAll(re)) {
        if (m.index! > last) next.push({ kind: "text", value: tok.value.slice(last, m.index) });
        next.push({ kind: kind as "bold" | "italic" | "underline", value: m[1] });
        last = m.index! + m[0].length;
      }
      if (last < tok.value.length) next.push({ kind: "text", value: tok.value.slice(last) });
    }
    tokens = next;
  }
  return tokens.filter((t) => t.value !== "");
}
