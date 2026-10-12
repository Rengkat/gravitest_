import { LucideIcon } from "lucide-react";

export default function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}) {
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
        <span className="text-[22px] font-bold text-green-900">{value}</span>
      </div>
      <div className="text-[13px] font-medium text-text-muted">{label}</div>
    </div>
  );
}
