"use client";

// components/ui/loaders/inline-spinners.tsx
//
// A set of small, composable inline loading indicators.
// All are purely visual — no state, pure CSS animations.
//
// Exports:
//   DualRingSpinner   — for buttons & form submissions
//   TripleRingSpinner — for card / section loading
//   DotBounceSpinner  — for chat & AI streaming
//   ProgressBar       — for file uploads & CSV import (determinate + indeterminate)
//   LogoPulse         — for full-section placeholder
//   ButtonSpinner     — full loading button state (dark & light variants)

/* ─────────────────────────────────────────────────────────
   Shared keyframes injected once
───────────────────────────────────────────────────────── */
const KEYFRAMES = `
  @keyframes spin         { to { transform: rotate(360deg); } }
  @keyframes dot-bounce   { 0%,80%,100%{transform:translateY(0);opacity:.5} 40%{transform:translateY(-9px);opacity:1} }
  @keyframes indeterminate{ 0%{width:0%;margin-left:0%} 50%{width:60%;margin-left:20%} 100%{width:0%;margin-left:100%} }
  @keyframes center-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
`;

/* ─────────────────────────────────────────────────────────
   DualRingSpinner
   size: 'sm' (22px) | 'md' (28px)
───────────────────────────────────────────────────────── */
interface DualRingProps {
  size?: "sm" | "md";
  className?: string;
}

export function DualRingSpinner({ size = "sm", className = "" }: DualRingProps) {
  const px = size === "md" ? 28 : 22;
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        data-testid="dual-ring-spinner"
        className={`relative flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
        role="status"
        aria-label="Loading">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid rgba(26,74,46,0.1)",
            borderTopColor: "#1a4a2e",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: 5,
            border: "1.5px solid rgba(46,139,87,0.12)",
            borderTopColor: "#2e8b57",
            animation: "spin 1.3s linear infinite reverse",
          }}
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   TripleRingSpinner
───────────────────────────────────────────────────────── */
interface TripleRingProps {
  size?: number;
  className?: string;
}

export function TripleRingSpinner({ size = 36, className = "" }: TripleRingProps) {
  const inset1 = Math.round(size * 0.194); // ~7px at 36
  const inset2 = Math.round(size * 0.389); // ~14px at 36
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        data-testid="triple-ring-spinner"
        className={`relative flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
        role="status"
        aria-label="Loading">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2.5px solid rgba(26,74,46,0.08)",
            borderTopColor: "#1a4a2e",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: inset1,
            border: "2px solid rgba(46,139,87,0.1)",
            borderTopColor: "#2e8b57",
            animation: "spin 1.5s linear infinite reverse",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: inset2,
            border: "1.5px solid rgba(245,200,66,0.2)",
            borderTopColor: "#f5c842",
            animation: "spin 0.75s linear infinite",
          }}
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   DotBounceSpinner
   Used for chat typing indicators and AI streaming states.
───────────────────────────────────────────────────────── */
interface DotBounceProps {
  className?: string;
  inverted?: boolean;
}

export function DotBounceSpinner({ className = "", inverted = false }: DotBounceProps) {
  const dots = [
    { bg: inverted ? "rgba(255,255,255,0.35)" : "rgba(26,74,46,0.35)", delay: "0s" },
    { bg: "#3aab6a", delay: "0.15s" },
    { bg: "#f5c842", delay: "0.3s" },
  ];
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        data-testid="dot-bounce-spinner"
        className={`flex items-center gap-[5px] ${className}`}
        role="status"
        aria-label="Loading">
        {dots.map((d, i) => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              background: d.bg,
              animation: `dot-bounce 1.2s ease-in-out infinite ${d.delay}`,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   ProgressBar
   determinate: pass a 0–100 value prop
   indeterminate: omit value (or pass undefined)
───────────────────────────────────────────────────────── */
interface ProgressBarProps {
  value?: number; // 0–100 for determinate; undefined for indeterminate
  label?: string; // e.g. "Uploading students…"
  height?: number; // px, default 6
  className?: string;
}

export function ProgressBar({ value, label, height = 6 }: ProgressBarProps) {
  const isDeterminate = value !== undefined;
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        data-testid="progress-bar"
        role="progressbar"
        aria-label={label ?? "Loading"}
        {...(isDeterminate && {
          "aria-valuemin": 0,
          "aria-valuemax": 100,
          "aria-valuenow": value,
        })}>
        {label && (
          <div className="flex justify-between mb-2">
            <span style={{ fontSize: 12, color: "#4a6357" }}>{label}</span>
            {isDeterminate && (
              <span
                style={{
                  fontSize: 12,
                  color: "#1a4a2e",
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono',monospace",
                }}>
                {value}%
              </span>
            )}
          </div>
        )}
        <div
          className="w-full overflow-hidden rounded-sm"
          style={{ height, background: "rgba(26,74,46,0.1)" }}>
          <div
            className="h-full rounded-sm"
            style={{
              background: "linear-gradient(90deg, #1a4a2e, #3aab6a)",
              ...(isDeterminate
                ? { width: `${value}%`, transition: "width 0.4s ease" }
                : { animation: "indeterminate 2s ease-in-out infinite" }),
            }}
          />
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   LogoPulse
   Full-section placeholder with pulsing "G" mark.
───────────────────────────────────────────────────────── */
interface LogoPulseProps {
  className?: string;
}

export function LogoPulse({ className = "" }: LogoPulseProps) {
  return (
    <>
      <style>{KEYFRAMES}</style>
      <div
        data-testid="logo-pulse"
        className={`flex flex-col items-center gap-3 ${className}`}
        role="status"
        aria-label="Loading">
        <div
          className="flex items-center justify-center rounded-[14px]"
          style={{
            width: 40,
            height: 40,
            background: "#1a4a2e",
            fontFamily: "'DM Serif Display', serif",
            fontSize: 20,
            color: "#f5c842",
            animation: "center-pulse 2s ease-in-out infinite",
          }}>
          G
        </div>
        <span
          style={{
            fontSize: 11,
            color: "#4a6357",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
          Loading…
        </span>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   ButtonSpinner
   Full-width loading button in dark and light variants.
   Drop-in replacement for a submit button while awaiting.
───────────────────────────────────────────────────────── */
interface ButtonSpinnerProps {
  label?: string;
  variant?: "dark" | "light";
  spinnerType?: "ring" | "dots";
  disabled?: boolean;
  className?: string;
}

export function ButtonSpinner({
  label,
  variant = "dark",
  spinnerType = "ring",
  disabled = true,
  className = "",
}: ButtonSpinnerProps) {
  const isDark = variant === "dark";
  const defaultLabel = spinnerType === "ring" ? "Processing payment…" : "Generating questions…";

  return (
    <>
      <style>{KEYFRAMES}</style>
      <button
        data-testid="button-spinner"
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2.5 w-full px-6 py-3 rounded-[10px] text-[14px] font-semibold cursor-not-allowed opacity-85 border-none ${className}`}
        style={{
          fontFamily: "'Sora', sans-serif",
          background: isDark ? "#1a4a2e" : "white",
          color: isDark ? "white" : "#1a4a2e",
          border: isDark ? "none" : "2px solid rgba(26,74,46,0.2)",
        }}>
        {spinnerType === "ring" ? (
          <DualRingSpinner size="sm" />
        ) : (
          <DotBounceSpinner inverted={isDark} />
        )}
        {label ?? defaultLabel}
      </button>
    </>
  );
}
