"use client";

import { createContext, useContext } from "react";
import { TimeRange } from "@/types/performance";

// Time range is the one filter that actually maps to something the
// backend supports (`days` on /students/me/performance and /me/activity).
// Exam-type and subject are still local UI state in the layout for now —
// wiring them would mean per-tab query params, which is a larger change
// than this pass covers; the selects are left visible but are session
// history filters a user can apply within the Exams tab itself instead.
export const TIME_RANGE_TO_DAYS: Record<TimeRange, number> = {
  week: 7,
  month: 30,
  "3months": 90,
  year: 365,
  all: 3650,
};

interface PerformanceFilterState {
  timeRange: TimeRange;
  days: number;
}

export const PerformanceFilterContext = createContext<PerformanceFilterState>({
  timeRange: "month",
  days: 30,
});

export function usePerformanceFilter() {
  return useContext(PerformanceFilterContext);
}
