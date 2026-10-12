"use client";
import { useEffect, useState, type JSX } from "react";

type Variant = "fullscreen" | "inline" | "skeleton" | "exam" | "overlay";
type Context = "default" | "dashboard" | "exam" | "library";

interface GravitasLoaderProps {
  variant?: Variant;
  context?: Context;
  message?: string;
  progress?: number;
  className?: string;
}

// ── Context-aware messages ─────────────────────────────────────────────
const MESSAGES: Record<Context, string[]> = {
  default: ["Loading…", "Almost there…", "Fetching your data…"],
  dashboard: ["Loading your dashboard…", "Fetching your scores…", "Preparing your study plan…"],
  exam: ["Loading exam questions…", "Preparing your session…", "Fetching past questions…"],
  library: ["Loading content library…", "Fetching video lessons…", "Preparing your materials…"],
};

// ── Animated counter hook ──────────────────────────────────────────────
function useCyclingMessage(messages: string[], interval = 2200): string {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), interval);
    return () => clearInterval(t);
  }, [messages, interval]);
  return messages[idx];
}

// ══════════════════════════════════════════════════════════════════════
// VARIANT: FULLSCREEN — the main app loading screen
// ══════════════════════════════════════════════════════════════════════
export default function FullPage({
  context = "default",
  message,
  progress,
}: GravitasLoaderProps): JSX.Element {
  const messages = message ? [message] : MESSAGES[context];
  const currentMessage = useCyclingMessage(messages);
  const [mounted] = useState(() => typeof window !== "undefined");

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0d2b1a 0%, #1a4a2e 55%, #1f5c38 100%)" }}
      aria-live="polite"
      role="status"
      aria-label="Loading Gravitest">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow — centre */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 520,
          height: 520,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(58,171,106,0.16) 0%, transparent 70%)",
          animation: "glow-pulse 3.5s ease-in-out infinite",
        }}
      />

      {/* Radial glow — gold bottom right */}
      <div
        className="absolute bottom-0 right-0 pointer-events-none"
        style={{
          width: 360,
          height: 360,
          background: "radial-gradient(circle, rgba(245,200,66,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Logo + Wordmark ── */}
      <div
        className="relative z-10 flex flex-col items-center gap-5"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(28px)",
          transition:
            "opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}>
        {/* Logo mark */}
        <div className="relative">
          {/* Outer orbit ring */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "1.5px solid rgba(245,200,66,0.2)",
              width: 108,
              height: 108,
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              animation: "orbit-spin 8s linear infinite",
            }}
          />
          {/* Orbit dot */}
          <div
            className="absolute"
            style={{
              width: 7,
              height: 7,
              background: "#f5c842",
              borderRadius: "50%",
              top: "50%",
              left: "50%",
              transformOrigin: "0 0",
              animation: "orbit-dot 8s linear infinite",
              boxShadow: "0 0 8px rgba(245,200,66,0.6)",
            }}
          />

          {/* Logo box */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              borderRadius: 22,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.14)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              animation: "logo-breathe 3s ease-in-out infinite",
            }}>
            {/* Shimmer sweep */}
            <div
              className="absolute inset-0 overflow-hidden rounded-[22px]"
              style={{ animation: "shimmer-sweep 2.5s ease-in-out infinite 1s" }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer-move 2.5s ease-in-out infinite 1s",
                }}
              />
            </div>

            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 42,
                color: "#f5c842",
                lineHeight: 1,
                position: "relative",
                zIndex: 1,
              }}>
              G
            </span>
          </div>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1.5">
          <span
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 32,
              color: "#fff",
              letterSpacing: "-0.5px",
              opacity: mounted ? 1 : 0,
              transform: mounted ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.6s 0.15s ease, transform 0.6s 0.15s ease",
            }}>
            Gravitest
          </span>

          {/* Cycling status message */}
          <div className="relative overflow-hidden" style={{ height: 18 }}>
            <p
              key={currentMessage}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                animation: "message-cycle 0.4s ease both",
                whiteSpace: "nowrap",
              }}>
              {currentMessage}
            </p>
          </div>
        </div>
      </div>

      {/* ── Loader dots ── */}
      <div
        className="relative z-10 flex items-center gap-2 mt-12"
        style={{
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.5s 0.3s ease",
        }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: i === 1 || i === 2 ? 8 : 6,
              height: i === 1 || i === 2 ? 8 : 6,
              borderRadius: "50%",
              background: i === 1 ? "#3aab6a" : i === 2 ? "#f5c842" : "rgba(255,255,255,0.25)",
              animation: `dot-bounce 1.4s ease-in-out infinite`,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      {/* ── Progress bar (determinate when progress prop is set) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div style={{ height: 3, background: "rgba(255,255,255,0.07)" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #1a4a2e, #2e8b57, #3aab6a, #f5c842)",
              borderRadius: "0 2px 2px 0",
              transition: progress !== undefined ? "width 0.4s ease" : "none",
              width: progress !== undefined ? `${progress}%` : "100%",
              animation:
                progress !== undefined
                  ? "none"
                  : "indeterminate-progress 2.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* ── CSS Keyframes ── */}
      <style>{`
        @keyframes glow-pulse {
          0%,100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
          50%      { transform: translate(-50%,-50%) scale(1.2); opacity: 0.6; }
        }
        @keyframes orbit-spin {
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes orbit-dot {
          0%   { transform: translate(-50%,-50%) rotate(0deg)   translate(54px) rotate(0deg); }
          100% { transform: translate(-50%,-50%) rotate(360deg) translate(54px) rotate(-360deg); }
        }
        @keyframes logo-breathe {
          0%,100% { box-shadow: 0 0 0 0 rgba(58,171,106,0); }
          50%      { box-shadow: 0 0 32px 4px rgba(58,171,106,0.15); }
        }
        @keyframes shimmer-move {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        @keyframes dot-bounce {
          0%,80%,100% { transform: translateY(0); opacity: 0.5; }
          40%         { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes message-cycle {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes indeterminate-progress {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
