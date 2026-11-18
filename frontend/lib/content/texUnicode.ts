/**
 * Students type maths symbols straight from the symbol bar or their keyboard — √ × ÷ ≤ π ² — and put them
 * INSIDE equations. KaTeX only treats those as plain text (a "√3" that isn't a proper root, "x²" in the wrong
 * font), so before typesetting we turn them into the LaTeX the equation tool would have written.
 * Display only: the stored answer text is never changed.
 */

const SYMBOLS: Record<string, string> = {
  "×": "\\times ", "÷": "\\div ", "±": "\\pm ", "∓": "\\mp ", "·": "\\cdot ", "−": "-",
  "≤": "\\leq ", "≥": "\\geq ", "≠": "\\neq ", "≈": "\\approx ", "≡": "\\equiv ", "∝": "\\propto ",
  "∞": "\\infty ", "∠": "\\angle ", "∴": "\\therefore ", "→": "\\to ", "⇒": "\\Rightarrow ", "∈": "\\in ",
  "°": "^{\\circ}", "∑": "\\sum ", "∫": "\\int ", "∆": "\\Delta ",
  "π": "\\pi ", "θ": "\\theta ", "α": "\\alpha ", "β": "\\beta ", "γ": "\\gamma ", "δ": "\\delta ",
  "λ": "\\lambda ", "μ": "\\mu ", "σ": "\\sigma ", "φ": "\\phi ", "ω": "\\omega ",
  "Δ": "\\Delta ", "Σ": "\\Sigma ", "Ω": "\\Omega ", "Π": "\\Pi ", "Θ": "\\Theta ",
  "½": "\\frac{1}{2}", "¼": "\\frac{1}{4}", "¾": "\\frac{3}{4}",
};

const SUPERSCRIPT: Record<string, string> = {
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁺": "+", "⁻": "-",
};

/** √ followed by (…), {…}, or a run of letters/digits → \sqrt{…}. */
function convertRoots(src: string): string {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== "√") {
      out += src[i];
      continue;
    }
    const rest = src.slice(i + 1);
    const open = rest[0];
    if (open === "(" || open === "{") {
      const close = open === "(" ? ")" : "}";
      let depth = 0;
      let end = -1;
      for (let j = 0; j < rest.length; j++) {
        if (rest[j] === open) depth++;
        else if (rest[j] === close && --depth === 0) {
          end = j;
          break;
        }
      }
      if (end > 0) {
        out += `\\sqrt{${rest.slice(1, end)}}`;
        i += end + 1;
        continue;
      }
    }
    const run = rest.match(/^[A-Za-z0-9.]+/);
    if (run) {
      out += `\\sqrt{${run[0]}}`;
      i += run[0].length;
    } else {
      out += "\\surd ";
    }
  }
  return out;
}

function convert(src: string): string {
  let s = convertRoots(src);
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (run) => `^{${[...run].map((c) => SUPERSCRIPT[c]).join("")}}`);
  return s.replace(/[^\u0000-\u007f]/g, (c) => SYMBOLS[c] ?? c);
}

export function normalizeTexUnicode(tex: string): string {
  if (/^[\u0000-\u007f]*$/.test(tex)) return tex; // plain ASCII: nothing to do (the common case)
  // Leave \text{…} alone — inside it the characters are meant literally.
  return tex
    .split(/(\\text\{[^}]*\})/g)
    .map((part) => (part.startsWith("\\text{") ? part : convert(part)))
    .join("");
}
