/* ── Shared shimmer bone ── */
function Bone({
  w,
  h,
  r = 8,
  delay,
  className = "",
  style: extraStyle, // 👈 add
}: {
  w?: number | string;
  h: number;
  r?: number;
  delay?: string;
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
          "linear-gradient(90deg, rgba(26,74,46,0.06) 25%, rgba(26,74,46,0.11) 50%, rgba(26,74,46,0.06) 75%)",
        backgroundSize: "200% 100%",
        animation: `sk-shimmer 1.6s ease-in-out infinite ${delay ?? ""}`,
        flexShrink: 0,
        ...extraStyle,
      }}
    />
  );
}
const SIDEBAR_ITEMS = [1, 0.85, 0.7, 1, 0.6, 0.75];
const STAT_WIDTHS = ["60%", "55%", "50%", "65%"] as const;
const BAR_HEIGHTS = [55, 72, 45, 88, 63, 92, 70];
const LIST_OPACITIES = [1, 0.85, 0.7, 0.55];

export default function DashboardSkeleton() {
  return (
    <div
      data-testid="dashboard-skeleton"
      className="flex flex-col min-h-screen"
      style={{ background: "#fdfaf4" }}
      role="status"
      aria-label="Loading dashboard"
      aria-busy="true">
      {/* ── Top nav bar ── */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{
          height: 72,
          background: "var(--gt-surface)",
          borderBottom: "1px solid rgba(26,74,46,0.08)",
          padding: "0 5%",
        }}>
        <Bone w={38} h={38} r={10} />
        <Bone w={90} h={18} r={5} />
        <div className="flex gap-2 ml-5">
          {[80, 94, 68, 72].map((w, i) => (
            <Bone key={i} w={w} h={13} r={3} />
          ))}
        </div>
        <div className="flex gap-2.5 ml-auto">
          <Bone w={80} h={36} r={8} />
          <Bone w={100} h={36} r={8} />
        </div>
      </div>

      {/* ── Body ── */}
      <div
        className="flex flex-1 min-h-0"
        style={{ display: "grid", gridTemplateColumns: "240px 1fr" }}>
        {/* Sidebar */}
        <div
          className="flex flex-col gap-2 min-h-full"
          style={{ borderRight: "1px solid rgba(26,74,46,0.08)", padding: "24px 16px" }}>
          <Bone w={60} h={10} r={3} className="mb-2" />
          {SIDEBAR_ITEMS.map((opacity, i) => (
            <div
              key={i}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px]"
              style={{ opacity }}>
              <Bone w={20} h={20} r={6} />
              <Bone h={13} r={4} />
            </div>
          ))}
          <div className="mt-auto">
            <Bone h={60} r={12} />
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: "32px 40px", overflow: "hidden" }}>
          {/* Greeting */}
          <Bone w={260} h={28} r={6} className="mb-2.5" />
          <Bone w={180} h={14} r={4} className="mb-8" />

          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
              marginBottom: 28,
            }}>
            {STAT_WIDTHS.map((w, i) => (
              <div
                key={i}
                style={{
                  padding: 20,
                  borderRadius: 16,
                  background: "var(--gt-surface)",
                  border: "1px solid rgba(26,74,46,0.08)",
                }}>
                <Bone w={36} h={36} r={10} className="mb-3.5" />
                <Bone w={w} h={26} r={5} className="mb-2" />
                <Bone w="80%" h={12} r={3} />
              </div>
            ))}
          </div>

          {/* Two-column panels */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Exam list */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                background: "var(--gt-surface)",
                border: "1px solid rgba(26,74,46,0.08)",
              }}>
              <div className="flex justify-between mb-5">
                <Bone w={130} h={18} r={5} />
                <Bone w={55} h={14} r={4} />
              </div>
              {LIST_OPACITIES.map((opacity, i) => (
                <div key={i} className="flex items-center gap-3 mb-3.5" style={{ opacity }}>
                  <Bone w={40} h={40} r={12} />
                  <div className="flex-1">
                    <Bone h={14} r={4} className="mb-1.5" />
                    <Bone w="70%" h={11} r={3} />
                  </div>
                  <Bone w={52} h={26} r={8} />
                </div>
              ))}
            </div>

            {/* Score chart */}
            <div
              style={{
                padding: 24,
                borderRadius: 16,
                background: "var(--gt-surface)",
                border: "1px solid rgba(26,74,46,0.08)",
              }}>
              <Bone w={150} h={18} r={5} className="mb-6" />
              {/* Fake bar chart */}
              <div className="flex items-end gap-[7px] mb-4" style={{ height: 140 }}>
                {BAR_HEIGHTS.map((h, i) => (
                  <Bone
                    key={i}
                    h={Math.round((h / 100) * 140)}
                    r={0}
                    delay={`${i * 0.1}s`}
                    className="flex-1"
                    style={{ borderRadius: "4px 4px 0 0" } as React.CSSProperties}
                  />
                ))}
              </div>
              {/* X-axis labels */}
              <div className="flex justify-between">
                {BAR_HEIGHTS.map((_, i) => (
                  <Bone key={i} w={24} h={10} r={3} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sk-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
      `}</style>
    </div>
  );
}
