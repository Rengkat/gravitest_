"use client";

// components/ui/loaders/overlay-loader.tsx
//
// Semi-transparent overlay with blurred backdrop for blocking actions
// (e.g. payment processing, file generation, AI scoring).
//
// Usage:
//   import OverlayLoader from '@/components/ui/loaders/overlay-loader'
//   {isLoading && <OverlayLoader message="Processing payment…" />}
//   {isLoading && <OverlayLoader message="Generating report card…" sub="This may take a few seconds" />}

interface OverlayLoaderProps {
  message?: string;
  sub?: string;
}

export default function OverlayLoader({ message = "Loading…", sub }: OverlayLoaderProps) {
  return (
    <>
      <div
        data-testid="overlay-loader"
        className="fixed inset-0 z-40 flex items-center justify-center"
        style={{ background: "rgba(13,43,26,0.6)", backdropFilter: "blur(5px)" }}
        role="dialog"
        aria-modal="true"
        aria-label={message}
        aria-live="assertive">
        <div
          className="flex flex-col items-center gap-5 px-12 py-10 rounded-3xl"
          style={{
            background: "rgba(26,74,46,0.92)",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            animation: "fade-scale 0.3s cubic-bezier(0.16,1,0.3,1) both",
          }}>
          {/* Concentric rings */}
          <div className="relative" style={{ width: 64, height: 64 }}>
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                border: "2.5px solid rgba(255,255,255,0.1)",
                borderTopColor: "rgba(255,255,255,0.7)",
                animation: "spin 1s linear infinite",
              }}
            />
            {/* Inner gold ring */}
            <div
              className="absolute rounded-full"
              style={{
                inset: 10,
                border: "2px solid rgba(245,200,66,0.2)",
                borderTopColor: "#f5c842",
                animation: "spin 1.6s linear infinite reverse",
              }}
            />
            {/* Centre G */}
            <div
              className="absolute rounded-full flex items-center justify-center"
              style={{
                inset: 20,
                background: "rgba(255,255,255,0.08)",
                fontFamily: "'DM Serif Display', serif",
                fontSize: 16,
                color: "#f5c842",
              }}>
              G
            </div>
          </div>

          {/* Message */}
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.8)",
              fontWeight: 500,
            }}>
            {message}
          </p>

          {/* Sub-text */}
          {sub && (
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: "rgba(255,255,255,0.38)",
                letterSpacing: "0.05em",
              }}>
              {sub}
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin       { to { transform: rotate(360deg); } }
        @keyframes fade-scale { from{opacity:0;transform:scale(0.91)} to{opacity:1;transform:scale(1)} }
      `}</style>
    </>
  );
}
