import { useEffect, useState } from "react";
import { getAvailableQuestionCount, type BackendQuestionType } from "@/lib/api/exams";
import { buildPoolFilters } from "@/lib/session/practiceSession";
import type { PracticeConfig } from "@/types/practice";

/**
 * How many questions actually exist for the current wizard selection
 * (exam, candidate type, subject(s), year, question type). Returns
 * `count: null` while loading or if the lookup fails — callers should
 * treat null as "unknown", never as zero.
 */
export function useAvailableQuestionCount(
  config: PracticeConfig,
  questionType: BackendQuestionType | undefined,
  enabled: boolean,
) {
  const [state, setState] = useState<{ count: number | null; loading: boolean }>({
    count: null,
    loading: false,
  });

  const filters = buildPoolFilters(config);
  // Primitive key so the effect only re-runs when a filter really changes
  const key = JSON.stringify({ ...filters, questionType, enabled });

  useEffect(() => {
    if (!enabled || !filters.subjects.length) {
      setState({ count: null, loading: false });
      return;
    }
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true }));
    // Small debounce so quickly clicking through years/subjects sends one request
    const timer = setTimeout(async () => {
      try {
        const count = await getAvailableQuestionCount({ ...filters, questionType }, controller.signal);
        setState({ count, loading: false });
      } catch {
        if (!controller.signal.aborted) setState({ count: null, loading: false });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
