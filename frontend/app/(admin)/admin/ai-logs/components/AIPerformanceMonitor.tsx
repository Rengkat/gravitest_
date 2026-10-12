"use client";

import { Activity, Clock, CheckCircle, AlertTriangle, Repeat } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  stats: {
    totalRequests: number;
    avgResponseTime: number;
    successRate: number; // already a 0-100 percentage
    fallbackRate: number; // already a 0-100 percentage
    errorsByModel: Record<string, number>;
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div className="text-2xl font-bold text-green-900">{value}</div>
      <div className="text-[11px] text-text-muted mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function AIPerformanceMonitor({ stats }: Props) {
  const errorData = Object.entries(stats.errorsByModel)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Key metrics — all real, from AiAdminService.getPerformanceStats() */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard icon={Activity} label="Total Requests" value={stats.totalRequests.toLocaleString()} color="#2e8b57" />
        <MetricCard icon={Clock} label="Avg Response Time" value={`${stats.avgResponseTime}ms`} color="#3b82f6" />
        <MetricCard
          icon={CheckCircle}
          label="Success Rate"
          value={`${stats.successRate}%`}
          color={stats.successRate >= 98 ? "#10b981" : stats.successRate >= 90 ? "#f59e0b" : "#ef4444"}
        />
        <MetricCard
          icon={Repeat}
          label="Fallback Rate"
          value={`${stats.fallbackRate}%`}
          color={stats.fallbackRate < 5 ? "#10b981" : "#f59e0b"}
          sub="How often the primary model failed over to backup"
        />
      </div>

      {/* Errors by model */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="font-serif text-lg text-green-900">Errors by Model</h3>
        </div>
        {errorData.length === 0 ? (
          <p className="text-[13px] text-text-muted text-center py-12">
            No errors recorded — every AI request has succeeded so far.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={errorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,50,0.1)" />
              <XAxis dataKey="model" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" name="Errors" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
