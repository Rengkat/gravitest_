"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Sigma, X } from "lucide-react";
import MathSpan, { renderTex } from "./MathSpan";
import { EQUATION_CATEGORIES } from "@/lib/content/equationTemplates";
import {
  applyTemplate, countEmptyBoxes, matrixTemplate, nextPlaceholder, previousPlaceholder, PLACEHOLDER, systemTemplate,
} from "@/lib/content/equationEdit";

interface Props {
  /** Prefill when editing an existing equation. */
  initialTex?: string;
  initialDisplay?: boolean;
  editing?: boolean;
  onInsert: (tex: string, display: boolean) => void;
  onClose: () => void;
}

const BUILDER = "builders";
const chip =
  "rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-gray-900 hover:bg-green-50 hover:border-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green-700";

/**
 * "Insert equation" — build fractions, roots, powers, matrices, equation systems, integrals, chemistry and more
 * without knowing LaTeX, with a live typeset preview. Modelled on Word's equation tool:
 *   - pick a building block; it drops into the equation with empty boxes (□) to fill in;
 *   - Tab / Shift+Tab jump between the boxes; text selected beforehand fills the first box;
 *   - everything is a real button / field, fully keyboard- and screen-reader-operable.
 * The result is stored in the answer as \( … \) so it renders as proper maths everywhere (results, AI marking).
 */
export default function EquationDialog({ initialTex = "", initialDisplay = false, editing = false, onInsert, onClose }: Props) {
  const uid = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  const [tex, setTex] = useState(initialTex);
  const [display, setDisplay] = useState(initialDisplay);
  const [category, setCategory] = useState(EQUATION_CATEGORIES[0].id);
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [matrixKind, setMatrixKind] = useState<"pmatrix" | "bmatrix" | "vmatrix">("pmatrix");
  const [equations, setEquations] = useState(2);
  const [systemKind, setSystemKind] = useState<"cases" | "aligned">("cases");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    return () => {
      if (typeof dlg.close === "function" && dlg.open) dlg.close();
    };
  }, []);

  // After a template is inserted, put the selection on the first empty box once the field has re-rendered.
  useLayoutEffect(() => {
    const sel = pendingSelection.current;
    const field = fieldRef.current;
    if (sel && field) {
      field.focus();
      field.setSelectionRange(sel.start, sel.end);
      pendingSelection.current = null;
    }
  }, [tex]);

  const trimmed = tex.trim();
  const emptyBoxes = countEmptyBoxes(tex);
  const hasError = useMemo(() => !!trimmed && renderTex(trimmed, display).includes("katex-error"), [trimmed, display]);

  function insertTemplate(template: string) {
    const f = fieldRef.current;
    const start = f?.selectionStart ?? tex.length;
    const end = f?.selectionEnd ?? tex.length;
    const next = applyTemplate(tex, start, end, template);
    pendingSelection.current = { start: next.selStart, end: next.selEnd };
    setTex(next.tex);
  }

  function jump(forward: boolean, e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const f = e.currentTarget;
    const idx = forward ? nextPlaceholder(tex, f.selectionEnd) : previousPlaceholder(tex, f.selectionStart);
    if (idx === -1) return; // no more boxes: let Tab move focus on as normal
    e.preventDefault();
    f.setSelectionRange(idx, idx + PLACEHOLDER.length);
  }

  function submit() {
    if (!trimmed) return;
    onInsert(trimmed, display);
  }

  const active = EQUATION_CATEGORIES.find((c) => c.id === category);
  const titleId = `${uid}-title`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      // Keys here must not reach a surrounding exam page or dialog.
      onKeyDown={(e) => e.stopPropagation()}
      className="m-auto w-[min(46rem,96vw)] max-h-[94vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/60">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}>
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold">
            <Sigma size={19} className="text-green-700" aria-hidden="true" />
            {editing ? "Edit equation" : "Insert equation"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close equation editor"
            className="rounded-lg p-1.5 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          {/* The equation itself */}
          <div>
            <label htmlFor={`${uid}-tex`} className="mb-1 block text-sm font-semibold">
              Equation
            </label>
            <textarea
              id={`${uid}-tex`}
              ref={fieldRef}
              autoFocus
              rows={3}
              value={tex}
              onChange={(e) => setTex(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab" && !e.altKey && !e.ctrlKey && !e.metaKey) jump(!e.shiftKey, e);
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              spellCheck={false}
              aria-describedby={`${uid}-hint`}
              className="w-full resize-y rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 font-mono text-[13px] text-gray-900 focus:border-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            />
            <p id={`${uid}-hint`} className="mt-1 text-[12px] text-gray-700">
              Choose a building block below. Fill in the empty boxes (<span aria-hidden="true">□</span>
              <span className="sr-only">“square”</span>) — press Tab to jump to the next box. Select text first to
              put it in the first box. Ctrl+Enter inserts.
            </p>
          </div>

          {/* Live preview */}
          <div>
            <p className="mb-1 text-sm font-semibold">Preview</p>
            <div
              data-testid="equation-preview"
              className="flex min-h-[3.5rem] items-center overflow-x-auto rounded-xl border border-gray-200 bg-white px-4 py-3 text-[17px]">
              {trimmed ? (
                <MathSpan tex={trimmed} display={display} className="!my-0" />
              ) : (
                <span className="text-[13px] text-gray-600">Your equation appears here as you build it.</span>
              )}
            </div>
            {hasError && (
              <p role="status" className="mt-1 text-[12px] font-semibold text-red-700">
                This equation has a mistake — check that every bracket and brace is closed.
              </p>
            )}
            {!hasError && emptyBoxes > 0 && (
              <p role="status" className="mt-1 text-[12px] text-amber-800">
                {emptyBoxes} empty {emptyBoxes === 1 ? "box" : "boxes"} left — they will show as □ if you insert now.
              </p>
            )}
          </div>

          {/* Building blocks */}
          <div>
            <div role="group" aria-label="Kinds of equation parts" className="mb-3 flex flex-wrap gap-1.5">
              {[...EQUATION_CATEGORIES.map((c) => ({ id: c.id, label: c.label })), { id: BUILDER, label: "Matrices & systems" }].map(
                (c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={category === c.id}
                    onClick={() => setCategory(c.id)}
                    className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-green-700 ${
                      category === c.id ? "bg-green-800 text-white" : "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                    }`}>
                    {c.label}
                  </button>
                ),
              )}
            </div>

            {active && (
              <ul className="flex flex-wrap gap-2" aria-label={active.label}>
                {active.templates.map((tpl) => (
                  <li key={tpl.name}>
                    <button type="button" onClick={() => insertTemplate(tpl.tex)} aria-label={tpl.name} title={tpl.name} className={`${chip} min-w-[2.6rem]`}>
                      <span aria-hidden="true" className="pointer-events-none inline-flex items-center">
                        <MathSpan tex={tpl.tex} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {category === BUILDER && (
              <div className="grid gap-4 sm:grid-cols-2">
                <fieldset className="rounded-xl border border-gray-200 p-3">
                  <legend className="px-1 text-sm font-semibold">Matrix</legend>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-[12px] font-semibold">
                      Rows
                      <input type="number" min={1} max={6} value={rows} onChange={(e) => setRows(Number(e.target.value))} className="mt-1 block w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-[13px]" />
                    </label>
                    <label className="text-[12px] font-semibold">
                      Columns
                      <input type="number" min={1} max={6} value={cols} onChange={(e) => setCols(Number(e.target.value))} className="mt-1 block w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-[13px]" />
                    </label>
                    <label className="text-[12px] font-semibold">
                      Brackets
                      <select value={matrixKind} onChange={(e) => setMatrixKind(e.target.value as typeof matrixKind)} className="mt-1 block rounded-lg border border-gray-300 px-2 py-1.5 text-[13px]">
                        <option value="pmatrix">Round ( )</option>
                        <option value="bmatrix">Square [ ]</option>
                        <option value="vmatrix">Determinant | |</option>
                      </select>
                    </label>
                  </div>
                  <button type="button" onClick={() => insertTemplate(matrixTemplate(rows, cols, matrixKind))} className={`${chip} mt-3`}>
                    Add {rows}×{cols} matrix
                  </button>
                </fieldset>

                <fieldset className="rounded-xl border border-gray-200 p-3">
                  <legend className="px-1 text-sm font-semibold">Simultaneous equations</legend>
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="text-[12px] font-semibold">
                      Equations
                      <input type="number" min={2} max={5} value={equations} onChange={(e) => setEquations(Number(e.target.value))} className="mt-1 block w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-[13px]" />
                    </label>
                    <label className="text-[12px] font-semibold">
                      Layout
                      <select value={systemKind} onChange={(e) => setSystemKind(e.target.value as typeof systemKind)} className="mt-1 block rounded-lg border border-gray-300 px-2 py-1.5 text-[13px]">
                        <option value="cases">Joined by a brace {"{"}</option>
                        <option value="aligned">Lined up at “=”</option>
                      </select>
                    </label>
                  </div>
                  <button type="button" onClick={() => insertTemplate(systemTemplate(equations, systemKind))} className={`${chip} mt-3`}>
                    Add {equations} equations
                  </button>
                </fieldset>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-[13px] font-semibold">
            <input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} className="h-4 w-4 accent-green-700" />
            Show on its own line, centred (for a long or important equation)
          </label>
        </div>

        <footer className="flex flex-wrap justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!trimmed}
            className="rounded-full bg-green-800 px-6 py-2.5 text-[13px] font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
            {editing ? "Update equation" : "Insert equation"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
