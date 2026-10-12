"use client";
import { ClipboardList, Shuffle, Timer, CircleCheck } from "lucide-react";
// components/ui/loaders/exam-loader.tsx
//
// Full-page loading screen specific to starting a CBT exam session.
// Shows an animated step-by-step checklist so the student knows
// exactly what the system is doing.
//
// Usage:
//   import ExamLoader from '@/components/ui/loaders/exam-loader'
//   <ExamLoader />
//   <ExamLoader title="Preparing JAMB Mock" />

import { useEffect, useState } from "react";

interface ExamLoaderProps {
  title?: string;
}

const STEPS = [
  { icon: ClipboardList, label: "Fetching past questions" },
  { icon: Shuffle, label: "Randomising question order" },
  { icon: Timer, label: "Setting up your timer" },
  { icon: CircleCheck, label: "Session ready!" },
];

function CheckIcon() {
  return (
    <svg width="13" height="10" fill="none" viewBox="0 0 13 10" aria-hidden="true">
      <path
        d="M1.5 5l3 3L11.5 1"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ExamLoader({ title = "Preparing your exam session" }: ExamLoaderProps) {
  // step = number of completed steps (0 = none done yet)
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    const timings = [0, 800, 1600, 2500];
    const timers = timings.map((delay, i) => setTimeout(() => setDoneCount(i + 1), delay));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      data-testid="exam-loader"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#fdfaf4" }}
      role="status"
      aria-label="Loading exam session"
      aria-live="polite">
      {/* Triple concentric rings */}
      <div className="relative mb-9" style={{ width: 120, height: 120 }}>
        {[
          {
            inset: "0",
            border: "2px solid rgba(26,74,46,0.08)",
            top: "#1a4a2e",
            dur: "1.1s",
            dir: "normal",
          },
          {
            inset: "15px",
            border: "2px solid rgba(26,74,46,0.06)",
            top: "#2e8b57",
            dur: "1.6s",
            dir: "reverse",
          },
          {
            inset: "29px",
            border: "1.5px solid rgba(245,200,66,0.18)",
            top: "#f5c842",
            dur: "0.85s",
            dir: "normal",
          },
        ].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              inset: r.inset,
              border: r.border,
              borderTopColor: r.top,
              animation: `spin ${r.dur} linear infinite ${r.dir}`,
            }}
          />
        ))}
        {/* Centre G badge */}
        <div
          className="absolute flex items-center justify-center rounded-[14px]"
          style={{
            width: 44,
            height: 44,
            top: "50%",
            left: "50%",
            marginTop: -22,
            marginLeft: -22,
            background: "#1a4a2e",
            fontFamily: "'DM Serif Display', serif",
            fontSize: 22,
            color: "#f5c842",
            animation: "centre-pulse 2.5s ease-in-out infinite",
          }}>
          G
        </div>
      </div>

      {/* Title + subtitle */}
      <h2
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 24,
          color: "#0d2b1a",
          letterSpacing: "-0.3px",
          textAlign: "center",
          marginBottom: 6,
        }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: "#4a6357", textAlign: "center", marginBottom: 36 }}>
        This only takes a moment…
      </p>

      {/* Step checklist */}
      <ol
        className="flex flex-col gap-2.5"
        style={{ width: 300, listStyle: "none" }}
        aria-label="Setup steps">
        {STEPS.map((step, i) => {
          const stepNumber = i + 1;
          const isDone = doneCount > stepNumber;
          const isActive = doneCount === stepNumber;
          const isWaiting = doneCount < stepNumber;

          return (
            <li
              key={step.label}
              data-testid={`exam-step-${i}`}
              className="flex items-center gap-3 px-4 py-[11px] rounded-xl"
              style={{
                background: isDone
                  ? "rgba(46,139,87,0.05)"
                  : isActive
                    ? "rgba(26,74,46,0.04)"
                    : "white",
                border: `1px solid ${isDone ? "rgba(46,139,87,0.2)" : isActive ? "rgba(26,74,46,0.18)" : "rgba(26,74,46,0.08)"}`,
                opacity: isWaiting ? 0.4 : 1,
                fontSize: 13,
                color: isDone ? "#1a4a2e" : isActive ? "#0d2b1a" : "#4a6357",
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.35s ease",
                animation: `step-in 0.3s ${i * 0.08}s ease both`,
              }}>
              {/* Step icon */}
              <div
                className="flex items-center justify-center rounded-lg flex-shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: isDone ? "#2e8b57" : "rgba(26,74,46,0.08)",
                  fontSize: isDone ? 13 : 15,
                  color: isDone ? "white" : undefined,
                  transition: "background 0.3s ease",
                }}>
                {isDone ? <CheckIcon /> : <step.icon />}
              </div>

              {/* Label */}
              <span className="flex-1">{step.label}</span>

              {/* Right indicator */}
              {isActive && (
                <div
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: 14,
                    height: 14,
                    border: "2px solid rgba(26,74,46,0.15)",
                    borderTopColor: "#1a4a2e",
                    animation: "spin 0.7s linear infinite",
                  }}
                />
              )}
              {isDone && <span style={{ color: "#2e8b57", fontSize: 14, flexShrink: 0 }}>✓</span>}
            </li>
          );
        })}
      </ol>

      <style>{`
        @keyframes spin         { to { transform: rotate(360deg); } }
        @keyframes centre-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes step-in      { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
      `}</style>
    </div>
  );
}
