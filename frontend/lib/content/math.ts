/**
 * Maths in question/answer text — pure functions, no React, no DOM.
 *
 * Content reaches the app in two shapes:
 *   1. EXPLICIT: LaTeX inside delimiters — \( … \), \[ … \], $ … $, $$ … $$ (AI replies, new content).
 *   2. LEGACY:   plain-text maths typed before typesetting existed, e.g. "(5x + 3)/[6x(x + 1)]",
 *                "x^2", "H_2O", "a^2+b^2=c^2".
 *
 * `splitMath` finds (1). `upgradeLegacyMath` rewrites the UNAMBIGUOUS cases of (2) into (1) so one renderer
 * handles both. It is deliberately conservative: it never touches text already inside math/code, never
 * treats a backslash as a command, and leaves anything that could just as well be prose (a lone "3/4",
 * "and/or", "(a)/(b)", "snake_case") exactly as written.
 */

export type MathSegment = { kind: 'text'; value: string } | { kind: 'math'; value: string; display: boolean };

/* ── explicit delimiters ─────────────────────────────────────────────── */

// Alternatives, in priority order:  \$ (escaped dollar) | $$…$$ | \[…\] | \(…\) | $…$
// A single-dollar span can't start/end with whitespace and can't be followed by a digit, so prices like
// "costs $5 and $10" stay text.
const DELIMITED = /\\\$|\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)|\$(?!\s)([^$\n]*?[^$\s])\$(?!\d)/g;

export function splitMath(text: string): MathSegment[] {
  const out: MathSegment[] = [];
  let last = 0;
  const pushText = (t: string) => {
    if (!t) return;
    const prev = out[out.length - 1];
    if (prev?.kind === 'text') prev.value += t;
    else out.push({ kind: 'text', value: t });
  };
  for (const m of text.matchAll(DELIMITED)) {
    pushText(text.slice(last, m.index));
    last = (m.index ?? 0) + m[0].length;
    if (m[0] === '\\$') pushText('$');
    else if (m[1] !== undefined) out.push({ kind: 'math', value: m[1].trim(), display: true });
    else if (m[2] !== undefined) out.push({ kind: 'math', value: m[2].trim(), display: true });
    else if (m[3] !== undefined) out.push({ kind: 'math', value: m[3].trim(), display: false });
    else out.push({ kind: 'math', value: m[4].trim(), display: false });
  }
  pushText(text.slice(last));
  return out;
}

/* ── legacy plain-text maths ─────────────────────────────────────────── */

const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'cosec', 'log', 'ln', 'exp', 'lg', 'sqrt', 'lim']);
const PROTECTED = /```[\s\S]*?```|`[^`\n]+`|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]*?[^$\s]\$(?!\d)/g;
const ROMAN = /^(?:i{1,3}|iv|v|vi{0,3}|ix|x)$/i;

/** Substitutions inside a maths fragment. Never touches backslashes the content already has. */
function mathifyInner(s: string): string {
  return s
    .replace(/−/g, '-')
    .replace(/×/g, '\\times ')
    .replace(/÷/g, '\\div ')
    .replace(/\*/g, '\\cdot ')
    .replace(/≤/g, '\\le ')
    .replace(/≥/g, '\\ge ')
    .replace(/≠/g, '\\ne ')
    .replace(/π/g, '\\pi ')
    .replace(/θ/g, '\\theta ')
    .replace(/²/g, '^{2}')
    .replace(/³/g, '^{3}')
    .replace(/→|->/g, '\\rightarrow ')
    .replace(/\^([-+]?[A-Za-z0-9]+)/g, '^{$1}')
    // Subscripts: 1–3 digits, or ONE letter not followed by another letter. So H_2O → H_{2}O (the O is not part of it).
    .replace(/_(\d{1,3}|[A-Za-z](?![A-Za-z]))/g, '_{$1}')
    .replace(/\b([a-z]{2,6})\b/g, (w) => (FUNCTIONS.has(w) ? `\\${w}` : w));
}

/** A bracketed group that is clearly algebra, not words: a few letters-as-variables, numbers, operators. */
function isMathyGroup(inner: string): boolean {
  const s = inner.trim();
  if (!s || s.length > 60) return false;
  if (!/^[0-9A-Za-z\s+\-−×÷*/^().,[\]=<>≤≥²³π_{}]+$/.test(s)) return false;
  // Every run of letters must be a variable (1–2 letters) or a known function — so "(the cat)" is rejected.
  for (const run of s.match(/[A-Za-z]+/g) ?? []) {
    if (run.length > 2 && !FUNCTIONS.has(run.toLowerCase())) return false;
  }
  return /[0-9A-Za-z]/.test(s);
}

/** Something that makes a group maths rather than a label: a digit, an operator, or a function like sin. */
const hasMathSignal = (s: string) =>
  /[0-9+\-−×÷*^]/.test(s) || (s.match(/[A-Za-z]+/g) ?? []).some((w) => FUNCTIONS.has(w.toLowerCase()));

function matchBackward(src: string, closeIdx: number): number {
  const close = src[closeIdx];
  const open = close === ')' ? '(' : '[';
  let depth = 0;
  for (let i = closeIdx; i >= 0; i--) {
    if (src[i] === close) depth++;
    else if (src[i] === open && --depth === 0) return i;
  }
  return -1;
}

function matchForward(src: string, openIdx: number): number {
  const open = src[openIdx];
  const close = open === '(' ? ')' : ']';
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close && --depth === 0) return i;
  }
  return -1;
}

/** "(A)/(B)" with () or [] on either side → \frac{A}{B}. */
function upgradeFractions(chunk: string, stash: string[]): string {
  const found: { start: number; end: number; tex: string }[] = [];
  for (let i = 1; i < chunk.length - 1; i++) {
    if (chunk[i] !== '/' || !')]'.includes(chunk[i - 1]) || !'(['.includes(chunk[i + 1])) continue;
    const ls = matchBackward(chunk, i - 1);
    const re = matchForward(chunk, i + 1);
    if (ls < 0 || re < 0) continue;
    const num = chunk.slice(ls + 1, i - 1);
    const den = chunk.slice(i + 2, re);
    if (!isMathyGroup(num) || !isMathyGroup(den)) continue;
    if (!hasMathSignal(num) && !hasMathSignal(den)) continue; // "(a)/(b)" is a pair of labels
    if (ls > 0 && /[A-Za-z0-9]/.test(chunk[ls - 1])) continue; // f(x)/… — a function call, not a bare group
    if (found.some((f) => ls < f.end && re + 1 > f.start)) continue;
    found.push({ start: ls, end: re + 1, tex: `\\frac{${mathifyInner(num.trim())}}{${mathifyInner(den.trim())}}` });
  }
  let out = chunk;
  for (const f of found.sort((a, b) => b.start - a.start)) {
    stash.push(f.tex);
    out = `${out.slice(0, f.start)}\u0000${stash.length - 1}\u0000${out.slice(f.end)}`;
  }
  return out;
}

const MATH_TOKEN = /^[A-Za-z0-9_^{}()[\]+\-−*=<>.→|/]+$/;
const HAS_POWER = /[A-Za-z0-9)\]}]\^[{(+\-−]?[A-Za-z0-9]/;
const HAS_SUBSCRIPT = /[A-Za-z0-9)]_(?:\{[^}]{1,6}\}|[0-9]{1,3}|[A-Za-z](?![A-Za-z]))/;

/** Whitespace-separated tokens such as x^2, (a+b)^2, H_2O, N_A, a^2+b^2=c^2, 2H_2+O_2→2H_2O. */
function upgradeTokens(chunk: string): string {
  return chunk.replace(/\S+/g, (raw) => {
    const trail = raw.match(/[.,;:!?]+$/)?.[0] ?? '';
    const tok = trail ? raw.slice(0, -trail.length) : raw;
    if (!tok || !MATH_TOKEN.test(tok) || tok.includes('\u0000')) return raw;
    if (!HAS_POWER.test(tok) && !HAS_SUBSCRIPT.test(tok)) return raw;
    if (/[A-Za-z]{3,}_/.test(tok) || /^https?:/i.test(tok) || tok.includes('//')) return raw; // snake_case, URLs
    if (/_[^{A-Za-z0-9]/.test(tok)) return raw;
    return `\\(${mathifyInner(tok)}\\)${trail}`;
  });
}

function upgradePlain(chunk: string): string {
  if (!/[/^_]/.test(chunk)) return chunk;
  const stash: string[] = [];
  const withFractions = upgradeFractions(chunk, stash);
  const withTokens = upgradeTokens(withFractions);
  // Put the fractions back, each as its own inline math span.
  return withTokens.replace(/\u0000(\d+)\u0000/g, (_m, n) => `\\(${stash[Number(n)]}\\)`);
}

/**
 * Rewrites unambiguous plain-text maths as \( … \). Text already inside math delimiters or code is
 * left untouched, so this is idempotent: running it on its own output changes nothing.
 */
export function upgradeLegacyMath(text: string): string {
  if (!text || !/[/^_]/.test(text)) return text;
  let out = '';
  let last = 0;
  for (const m of text.matchAll(PROTECTED)) {
    out += upgradePlain(text.slice(last, m.index)) + m[0];
    last = (m.index ?? 0) + m[0].length;
  }
  return out + upgradePlain(text.slice(last));
}

/** Plain text of a piece of content (math shown as its TeX) — for aria-labels, previews and search. */
export function plainText(text: string): string {
  return splitMath(text)
    .map((s) => s.value)
    .join('');
}

// Re-exported for tests.
export const __internal = { ROMAN, isMathyGroup };
