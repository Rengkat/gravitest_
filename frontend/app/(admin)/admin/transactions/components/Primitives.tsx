"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

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

export function MiniStatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
  sub,
}: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  trend?: number;
  sub?: string;
}) {
  return (
    <div
      className="p-3 rounded-2xl bg-white border transition-all hover:-translate-y-1"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={14} style={{ color }} />
        </div>
        {trend !== undefined && (
          <span
            className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-lg font-bold text-green-900">{value}</div>
      <div className="text-[11px] text-text-muted">{label}</div>
      {sub && <div className="text-[10px] text-text-muted opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}

export function Badge({
  label,
  color,
  bg,
  icon: Icon,
  size = "sm",
}: {
  label: string;
  color: string;
  bg: string;
  icon?: any;
  size?: "xs" | "sm";
}) {
  const textSize = size === "xs" ? "text-[9px]" : "text-[10px]";
  const px = size === "xs" ? "px-1.5 py-0.5" : "px-2 py-0.5";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${textSize} ${px}`}
      style={{ background: bg, color }}>
      {Icon && <Icon size={size === "xs" ? 8 : 10} />}
      {label}
    </span>
  );
}

export function StatusPill({ label, bg, text }: { label: string; bg: string; text: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: bg, color: text }}>
      {label}
    </span>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-green-900 mb-2">{label}</label>
      <select
        title="value"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onChange,
}: {
  currentPage: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const btnCls =
    "px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-text-muted hover:bg-cream transition-colors disabled:opacity-50";
  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => i + Math.max(1, Math.min(currentPage - 2, totalPages - 4)),
  );
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button onClick={() => onChange(1)} disabled={currentPage === 1} className={btnCls}>
        First
      </button>
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={btnCls}>
        Prev
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 rounded-lg text-[13px] font-medium transition-all ${p === currentPage ? "bg-green-800 text-white" : "border border-gray-200 text-text-muted hover:bg-cream"}`}>
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={btnCls}>
        Next
      </button>
      <button
        onClick={() => onChange(totalPages)}
        disabled={currentPage === totalPages}
        className={btnCls}>
        Last
      </button>
    </div>
  );
}

export function fmt(n: number) {
  return `₦${n.toLocaleString()}`;
}
