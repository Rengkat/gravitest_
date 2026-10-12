"use client";

// ─── CARD ────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border ${className}`}
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {children}
    </div>
  );
}

// ─── MINI STAT CARD ──────────────────────────────────────────
export function MiniStatCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="text-[22px] font-bold text-green-900">{value}</div>
      <div className="text-[11px] text-text-muted">{label}</div>
      {sub && <div className="text-[10px] text-text-muted opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── TOGGLE ──────────────────────────────────────────────────
export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      title="toggle"
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        checked ? "bg-green-600" : "bg-gray-200"
      }`}>
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── FIELD LABEL ─────────────────────────────────────────────
export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[12px] font-semibold text-green-900 mb-1.5">{children}</label>
  );
}

// ─── DIFFICULTY CHIP ─────────────────────────────────────────
export function DifficultyChip({
  level,
  selected,
  onClick,
}: {
  level: string;
  selected: boolean;
  onClick: () => void;
}) {
  const colors: Record<string, string> = {
    easy: "#10b981",
    medium: "#f59e0b",
    hard: "#f97316",
    expert: "#ef4444",
  };
  const color = colors[level] ?? "#6b7280";
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all"
      style={
        selected
          ? { background: color, color: "#fff" }
          : { background: "#f3f4f6", color: "#6b7280" }
      }>
      {level}
    </button>
  );
}

// ─── INPUT ───────────────────────────────────────────────────
export const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

// ─── SECTION DIVIDER ─────────────────────────────────────────
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[12px] font-bold text-green-900 uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}
