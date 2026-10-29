// Computed from the current year (rather than a hardcoded 2024) so this
// list keeps working without a code change every January, and doesn't
// silently go stale. Length capped — YearSection renders this in a
// bounded, scrollable list, so growing it over time won't blow out the
// page layout.
const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 11 }, (_, i) => (CURRENT_YEAR - i).toString());
export const QUESTION_COUNTS = [10, 20, 30, 40, 50, 60];
export { DEFAULT_EXAM_MINUTES as DEFAULT_TIME } from "@/lib/session/sessionSettings";
