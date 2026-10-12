"use client";

import {
  MessageSquare,
  DollarSign,
  Zap,
  CheckCircle,
  Users,
  Target,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Bot,
} from "lucide-react";
import { useAIData } from "./useAIData";
import { LoadingSpinner } from "./components/LoadingSinner";

function MetricCard({ icon: Icon, label, value, color, trend, sub }: any) {
  return (
    <div className="p-3 rounded-xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
        style={{ background: `${color}15` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div className="text-base font-bold text-green-900">{value}</div>
      <div className="text-[10px] text-text-muted">{label}</div>
      {Number(trend) > 0 && (
        <div className="text-[9px] text-green-600 mt-1 flex items-center gap-0.5">
          <TrendingUp size={8} /> +{trend}%
        </div>
      )}
      {sub && <div className="text-[8px] text-text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AILogsOverviewPage() {
  const { stats, costStats, performanceStats, loading, refreshData } = useAIData();

  if (loading) {
    return <LoadingSpinner text="Loading AI overview..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center shadow-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">AI Tutor Overview</h1>
            <p className="text-text-muted text-[13px] -mt-0.5">
              Platform-wide usage, cost, and quality snapshot
            </p>
          </div>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-cream transition-all text-[13px]">
          <RefreshCw size={14} className="text-text-muted" />
          <span className="text-text-muted">Refresh</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          icon={MessageSquare}
          label="Total Sessions"
          value={stats?.totalSessions?.toLocaleString() || "0"}
          color="#2e8b57"
        />
        <MetricCard
          icon={DollarSign}
          label="Total AI Cost"
          value={`$${costStats?.totalCostUsd?.toFixed(2) || "0"}`}
          color="#f59e0b"
          sub={`Today: $${costStats?.costToday?.toFixed(2) || "0"}`}
        />
        <MetricCard
          icon={Zap}
          label="Avg Response"
          value={`${performanceStats?.avgResponseTime || 0}ms`}
          color="#3b82f6"
        />
        <MetricCard
          icon={CheckCircle}
          label="Success Rate"
          value={`${performanceStats?.successRate || 0}%`}
          color="#10b981"
        />
        <MetricCard
          icon={Users}
          label="Active Users"
          value={stats?.activeUsers?.toLocaleString() || "0"}
          color="#8b5cf6"
        />
        <MetricCard
          icon={Target}
          label="Avg Rating"
          value={stats?.averageRating?.toFixed(1) || "0"}
          color="#f59e0b"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Flagged"
          value={stats?.flaggedCount || "0"}
          color="#ef4444"
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-xl border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-base text-green-900 mb-4">Cost by Feature</h3>
          <div className="space-y-3">
            {costStats?.costByFeature?.slice(0, 5).map((item: any) => (
              <div key={item.feature} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <Zap size={12} className="text-green-800" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-[12px] text-green-900">{item.feature}</span>
                    <span className="text-[12px] font-bold text-green-900">
                      ${item.cost.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-cream overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-800"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-text-muted">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="bg-white rounded-xl border p-5"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="font-serif text-base text-green-900 mb-4">Top AI Features</h3>
          <div className="space-y-3">
            {stats?.featureUsage?.slice(0, 5).map((feature: any, i: number) => (
              <div key={feature.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-green-900 w-5">{i + 1}</span>
                  <span className="text-[12px] text-green-900">{feature.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-text-muted">
                    {feature.count.toLocaleString()} req
                  </span>
                  <span className="text-[12px] font-bold text-green-900">
                    ${feature.cost?.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        className="bg-white rounded-xl border p-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <h3 className="font-serif text-base text-green-900 mb-4">Recent AI Activity</h3>
        <div className="space-y-3">
          {stats?.recentActivity?.slice(0, 5).map((activity: any) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream/20 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <MessageSquare size={12} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-green-900">
                    {activity.userName}
                  </span>
                  <span className="text-[10px] text-text-muted">•</span>
                  <span className="text-[10px] text-text-muted">{activity.feature}</span>
                </div>
                <div className="text-[10px] text-text-muted truncate">{activity.preview}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-text-muted">{activity.time}</div>
                <div className="text-[9px] text-green-700 font-mono">
                  ${activity.cost?.toFixed(4)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
