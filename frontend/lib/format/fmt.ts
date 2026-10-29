/**
 * Safe fixed-decimal formatter. Postgres `numeric`/`decimal`/AVG()/SUM() values
 * reach the browser as STRINGS (e.g. "0.0042"), and missing values arrive as
 * null/undefined — calling `.toFixed` on those throws. This coerces first and
 * falls back to 0 for anything that isn't a finite number.
 */
export function fmt(value: unknown, digits = 2): string {
  const n = typeof value === "number" ? value : Number(value);
  return (Number.isFinite(n) ? n : 0).toFixed(digits);
}
