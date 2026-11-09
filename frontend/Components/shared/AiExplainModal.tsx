"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Loader2, Lock, RefreshCw, Sparkles, X } from "lucide-react";
import { explainFailure, type ExplainFailure } from "@/lib/api/aiExplain";
import { accessErrorDecision, parseAccessError, type AccessError } from "@/lib/billing/errors";
import { UpgradePrompt } from "@/Components/billing/FeatureGate";
import MarkdownContent from "./MarkdownContent";
import MathText from "@/Components/content/MathText";
import QuestionImage from "@/Components/content/QuestionImage";

type LoadState =
  | { status: "loading" }
  | { status: "done"; text: string }
  | { status: "error"; failure: ExplainFailure }
  | { status: "locked"; access: AccessError };

/** Survives closing/reopening the dialog for ONE question (owned by the button). */
export interface ExplainCache {
  text?: string;
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface AiExplainModalProps {
  /** Short context shown under the title (the question itself). */
  questionText: string;
  /** The question's diagram (optional). */
  imageUrl?: string;
  /** Fetches the AI explanation for ONE question. Must be bound to that question. One request, one level. */
  request: () => Promise<string>;
  cache: ExplainCache;
  onClose: () => void;
}

/**
 * Wide, scrollable, accessible dialog for the AI explanation.
 * - Content is rendered as Markdown + maths, not raw text.
 * - Focus moves in on open, is trapped while open and returns to the opener on close. Esc closes.
 * - One AI request per question (cached while the page is open); loading / error / retry states.
 */
export default function AiExplainModal({ questionText, imageUrl, request, cache, onClose }: AiExplainModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const [state, setState] = useState<LoadState>(
    cache.text ? { status: "done", text: cache.text } : { status: "loading" },
  );

  const load = useCallback(() => {
    if (inFlight.current) return; // repeated clicks never duplicate a request
    inFlight.current = true;
    setState({ status: "loading" });
    request()
      .then((text) => {
        cache.text = text;
        setState({ status: "done", text });
      })
      .catch((err) => {
        const access = parseAccessError(err);
        // Billing/limit gates have their own upgrade UI; everything else is classified (locked / retryable / not).
        setState(access ? { status: "locked", access } : { status: "error", failure: explainFailure(err) });
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [request, cache]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    if (!cache.text) load();
    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-2 sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="flex w-full max-h-[94vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none sm:w-[90vw] lg:w-[85vw] sm:max-h-[90vh] max-w-6xl">
        <header className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-base font-bold text-gray-900 sm:text-lg">
            <Sparkles size={18} className="shrink-0 text-green-700" aria-hidden="true" />
            Sabi-AI Explains
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close explanation"
            className="shrink-0 rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-700">
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div
          aria-busy={state.status === "loading"}
          tabIndex={0}
          className="min-h-[200px] flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
          {/* The question (and its diagram) lives INSIDE the single scrolling area — never in a second, nested
              scroll box in the header — so nothing is clipped and there is only one scrollbar. */}
          <section
            aria-label="The question"
            data-testid="explain-question"
            className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
            {imageUrl && (
              <div className="shrink-0">
                <QuestionImage src={imageUrl} alt="The question diagram Sabi is explaining" size="compact" />
              </div>
            )}
            <MathText
              text={questionText}
              className="block min-w-0 flex-1 !text-[13.5px] !leading-relaxed !text-gray-700"
            />
          </section>

          {state.status === "loading" && (
            <div role="status" className="flex items-center justify-center gap-2 py-12 text-green-800">
              <Loader2 size={20} className="animate-spin" aria-hidden="true" />
              <span>Sabi is preparing the explanation…</span>
            </div>
          )}

          {state.status === "locked" && (
            <UpgradePrompt
              decision={accessErrorDecision(state.access)}
              upgradeHref="/dashboard/billing"
              featureLabel="AI Explain"
            />
          )}

          {state.status === "error" && state.failure.locked && (
            <div role="status" className="mx-auto max-w-md rounded-xl border border-amber-300 bg-amber-50 p-5 text-center">
              <Lock size={22} className="mx-auto mb-2 text-amber-700" aria-hidden="true" />
              <p className="mb-1 text-sm font-semibold text-amber-900">{state.failure.message}</p>
              {state.failure.code === "attempt_first" && (
                <>
                  <p className="mb-3 text-[13px] text-amber-800">Once you have answered it, ask Sabi again.</p>
                  <button
                    type="button"
                    onClick={load}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700">
                    <RefreshCw size={14} aria-hidden="true" /> I&apos;ve answered — check again
                  </button>
                </>
              )}
            </div>
          )}

          {state.status === "error" && !state.failure.locked && (
            <div role="alert" className="mx-auto max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-center">
              <AlertTriangle size={22} className="mx-auto mb-2 text-red-600" aria-hidden="true" />
              <p className="mb-3 text-sm text-red-700">{state.failure.message}</p>
              {state.failure.retryable ? (
                <button
                  type="button"
                  onClick={load}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700">
                  <RefreshCw size={14} aria-hidden="true" /> Try again
                </button>
              ) : (
                <p className="text-[12px] text-red-700/80">This can&apos;t be fixed by retrying — please tell your teacher or support.</p>
              )}
            </div>
          )}

          {state.status === "done" && (
            <div aria-live="polite">
              <MarkdownContent text={state.text} />
              <p className="mt-6 border-t border-gray-200 pt-3 text-xs text-gray-500">
                AI-generated from the official explanation on file. It can make mistakes — if it ever disagrees
                with your textbook or teacher, trust them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
