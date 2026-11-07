const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 years ago", "2 hours ago", "just now". `now` is injectable for tests. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (!Number.isFinite(abs) || abs < 45) return "just now";
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "always" });
  for (const [unit, size] of UNITS) {
    if (abs >= size) return fmt.format(Math.round(seconds / size), unit);
  }
  return fmt.format(Math.round(seconds / 60), "minute");
}

/** Absolute, screen-reader and tooltip friendly. */
export function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}
