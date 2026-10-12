"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AICostStats {
  totalCostUsd: number;
  costToday: number;
  costByFeature: { feature: string; cost: number; percentage: number }[];
  costByModel: { model: string; cost: number }[];
  costByUser: { userId: string; costUsd: number }[];
}

interface Props {
  stats: AICostStats;
}

const COLORS = ["#2e8b57", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

export function AICostAnalytics({ stats }: Props) {
  const totalUserCost = stats.costByUser.reduce((s, u) => s + u.costUsd, 0);

  return (
    <div className="space-y-6">
      {/* Totals strip */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="text-[11px] text-text-muted mb-1">Total AI Cost (all-time)</div>
          <div className="text-2xl font-bold text-green-900">${stats.totalCostUsd.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="text-[11px] text-text-muted mb-1">Cost Today</div>
          <div className="text-2xl font-bold text-green-900">${stats.costToday.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by model */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-lg text-green-900 mb-4">Cost Distribution by Model</h3>
          {stats.costByModel.length === 0 ? (
            <p className="text-[13px] text-text-muted text-center py-12">No usage recorded yet.</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.costByModel}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="cost"
                    nameKey="model"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {stats.costByModel.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                {stats.costByModel.map((model, i) => (
                  <div key={model.model} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{model.model}</span>
                    <span className="ml-auto font-semibold">${model.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Cost by feature */}
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-lg text-green-900 mb-4">Cost by Feature</h3>
          {stats.costByFeature.length === 0 ? (
            <p className="text-[13px] text-text-muted text-center py-12">No usage recorded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.costByFeature} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30,80,50,0.1)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 11, fill: "#6b7280" }} width={110} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="cost" fill="#2e8b57" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top spenders */}
      <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h3 className="font-serif text-lg text-green-900 mb-4">Top Spenders</h3>
        {stats.costByUser.length === 0 ? (
          <p className="text-[13px] text-text-muted text-center py-6">No usage recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                  <th className="text-left py-3 px-4 text-[11px] font-semibold text-text-muted uppercase">User</th>
                  <th className="text-right py-3 px-4 text-[11px] font-semibold text-text-muted uppercase">Cost</th>
                  <th className="text-center py-3 px-4 text-[11px] font-semibold text-text-muted uppercase">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.costByUser.slice(0, 10).map((user) => (
                  <tr key={user.userId} className="border-b hover:bg-cream/20" style={{ borderColor: "rgba(30,80,50,0.05)" }}>
                    <td className="py-3 px-4 text-[13px] font-mono text-green-900">{user.userId.slice(0, 12)}…</td>
                    <td className="py-3 px-4 text-right text-[13px] font-bold text-green-900">
                      ${user.costUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-cream overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-800"
                            style={{ width: `${totalUserCost > 0 ? (user.costUsd / totalUserCost) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-text-muted w-10">
                          {totalUserCost > 0 ? ((user.costUsd / totalUserCost) * 100).toFixed(1) : "0"}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
