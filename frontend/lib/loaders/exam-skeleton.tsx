/* ── Shimmer bone ── */
function Bone({
  w,
  h,
  r = 8,
  delay,
  bg,
  className = "",
  style: extraStyle,
}: {
  w?: number | string;
  h: number;
  r?: number;
  delay?: string;
  bg?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: w ?? "100%",
        height: h,
        borderRadius: r,
        background:
          bg ??
          "linear-gradient(90deg, rgba(26,74,46,0.06) 25%, rgba(26,74,46,0.11) 50%, rgba(26,74,46,0.06) 75%)",
        backgroundSize: "200% 100%",
        animation: `sk-shimmer 1.6s ease-in-out infinite ${delay ?? ""}`,
        flexShrink: 0,
        ...extraStyle,
      }}
    />
  );
}

// Navigator cell colors
const CELL_STATES: ("answered" | "flagged" | "current" | "empty")[] = [
  "answered",
  "answered",
  "answered",
  "flagged",
  "answered",
  "answered",
  "answered",
  "answered",
  "answered",
  "answered",
  "answered",
  "current",
  ...Array(28).fill("empty"),
];

const CELL_BG: Record<string, string> = {
  answered: "rgba(46,139,87,0.35)",
  flagged: "rgba(245,200,66,0.45)",
  current: "rgba(26,74,46,0.55)",
  empty: "", // shimmer
};

const TAB_WIDTHS = [110, 80, 90, 84];
const OPTION_OPACITIES = [1, 0.85, 0.7, 0.55];

export default function ExamSkeleton() {
  return (
    <div
      data-testid="exam-skeleton"
      className="flex flex-col min-h-screen"
      style={{ background: "#fdfaf4" }}
      role="status"
      aria-label="Loading exam"
      aria-busy="true">
      {/* ── Exam header bar ── */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ background: "#1a4a2e", padding: "14px 24px" }}>
        {/* Subject tabs */}
        <div className="flex gap-1.5">
          {TAB_WIDTHS.map((w, i) => (
            <div
              key={i}
              style={{
                width: w,
                height: 30,
                borderRadius: 6,
                background: "rgba(255,255,255,0.1)",
                animation: `sk-shimmer-dark 1.6s ease-in-out infinite ${i * 0.15}s`,
              }}
            />
          ))}
        </div>
        {/* Timer placeholder */}
        <div
          style={{
            width: 110,
            height: 34,
            borderRadius: 8,
            background: "rgba(230,57,70,0.5)",
            animation: "sk-shimmer-dark 1.6s ease-in-out infinite",
          }}
        />
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">
        {/* Question area */}
        <div style={{ flex: 1, padding: "32px 40px", overflow: "hidden" }}>
          {/* Meta row */}
          <div className="flex justify-between mb-6">
            <Bone w={140} h={13} r={4} />
            <Bone w={70} h={13} r={4} />
          </div>

          {/* Question text lines */}
          <Bone h={16} r={5} className="mb-2.5" />
          <Bone w="90%" h={16} r={5} className="mb-2.5" />
          <Bone w="70%" h={16} r={5} className="mb-8" />

          {/* Answer options */}
          {OPTION_OPACITIES.map((opacity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-[10px] mb-2.5"
              style={{ border: "1.5px solid rgba(26,74,46,0.1)", background: "var(--gt-surface)", opacity }}>
              <Bone w={26} h={26} r={13} />
              <Bone h={14} r={4} />
            </div>
          ))}

          {/* Sabi-Explain placeholder */}
          <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(13,43,26,0.85)" }}>
            <div
              style={{
                width: 110,
                height: 11,
                borderRadius: 3,
                background: "rgba(245,200,66,0.3)",
                marginBottom: 12,
              }}
            />
            <div
              style={{
                height: 13,
                borderRadius: 4,
                background: "rgba(255,255,255,0.1)",
                marginBottom: 8,
              }}
            />
            <div
              style={{
                height: 13,
                width: "75%",
                borderRadius: 4,
                background: "rgba(255,255,255,0.07)",
              }}
            />
          </div>
        </div>

        {/* Question navigator */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            borderLeft: "1px solid rgba(26,74,46,0.1)",
            background: "#f5f0e8",
            padding: 20,
          }}>
          <Bone w={100} h={11} r={3} className="mb-4" />
          <div className="flex flex-wrap gap-[5px]">
            {CELL_STATES.map((state, i) => {
              const isEmpty = state === "empty";
              return (
                <div
                  key={i}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: isEmpty ? undefined : CELL_BG[state],
                    ...(isEmpty
                      ? {
                          background:
                            "linear-gradient(90deg, rgba(26,74,46,0.06) 25%, rgba(26,74,46,0.11) 50%, rgba(26,74,46,0.06) 75%)",
                          backgroundSize: "200% 100%",
                          animation: `sk-shimmer 1.6s ease-in-out infinite ${i * 0.05}s`,
                        }
                      : {}),
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sk-shimmer      { from{background-position:200% 0} to{background-position:-200% 0} }
        @keyframes sk-shimmer-dark { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
