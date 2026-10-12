import { LucideIcon, ArrowUp, ArrowDown } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  color,
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
  trend?: number;
}) {
  // `trend` can legitimately be 0 (or undefined). Never render it with a bare
  // `{trend && ...}` — React prints a literal "0" for a falsy number, which
  // is what appeared next to the revenue figure.
  const hasTrend = typeof trend === "number" && Number.isFinite(trend) && trend !== 0;
  const isPositive = hasTrend && (trend as number) > 0;

  return (
    <div
      className="p-5 rounded-2xl bg-white border transition-all duration-300 hover:-translate-y-1"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15` }}>
          <Icon size={18} strokeWidth={1.8} style={{ color }} />
        </div>
        <div className="text-right">
          <span className="text-[22px] font-bold text-green-900">{value}</span>
          {hasTrend && (
            <div
              className={`flex items-center justify-end gap-1 mt-1 ${
                isPositive ? "text-green-600" : "text-red-500"
              }`}>
              {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span className="text-[11px] font-semibold">{Math.abs(trend as number)}%</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-[13px] font-medium text-text-muted">{label}</div>
    </div>
  );
}
