"use client";

import { Receipt, TrendingUp, CreditCard, CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react";
import type { TransactionStats, SubscriptionStats } from "@/lib/api/admin-dashboard";
import { Card, MiniStatCard } from "./Primitives";

// Revenue-by-plan/channel/role breakdowns, churn rate, conversion rate,
// customer lifetime value, "top customers", and monthly acquisition
// charts used to live here — none of it has a real backend source (no
// per-plan revenue split, no churn tracking, no CLV calc anywhere in the
// codebase). What's left is genuinely real, composed from
// /transactions/stats and /subscriptions/stats.
export function AnalyticsDashboard({
  stats,
}: {
  stats: { txn: TransactionStats; sub: SubscriptionStats };
}) {
  const { txn, sub } = stats;
  const revenueChange =
    txn.revenueLastMonthKobo > 0
      ? Math.round(((txn.revenueThisMonthKobo - txn.revenueLastMonthKobo) / txn.revenueLastMonthKobo) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStatCard
          icon={Receipt}
          label="Total Revenue"
          value={`₦${(txn.totalRevenueKobo / 100).toLocaleString()}`}
          color="#2e8b57"
        />
        <MiniStatCard
          icon={TrendingUp}
          label="This Month"
          value={`₦${(txn.revenueThisMonthKobo / 100).toLocaleString()}`}
          color="#0284c7"
          trend={revenueChange}
        />
        <MiniStatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={sub.activeCount.toLocaleString()}
          color="#8b5cf6"
        />
        <MiniStatCard
          icon={TrendingUp}
          label="Est. MRR"
          value={`₦${(sub.estimatedMonthlyRecurringRevenueKobo / 100).toLocaleString()}`}
          color="#f97316"
        />
      </div>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Transactions by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: "success", label: "Success", Icon: CheckCircle, color: "#10b981" },
            { key: "pending", label: "Pending", Icon: Clock, color: "#f59e0b" },
            { key: "failed", label: "Failed", Icon: XCircle, color: "#ef4444" },
            { key: "abandoned", label: "Abandoned", Icon: XCircle, color: "#9ca3af" },
            { key: "reversed", label: "Reversed", Icon: RotateCcw, color: "#6366f1" },
          ].map(({ key, label, Icon, color }) => (
            <div key={key} className="text-center p-3 rounded-xl bg-gray-50">
              <Icon size={20} className="mx-auto mb-1.5" style={{ color }} />
              <div className="text-lg font-bold text-green-900">{txn.countByStatus[key] ?? 0}</div>
              <div className="text-[11px] text-text-muted">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-serif text-lg text-green-900 mb-4">Subscription Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-green-50">
            <div className="text-xl font-bold text-green-900">{sub.activeCount}</div>
            <div className="text-[11px] text-text-muted">Active</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-amber-50">
            <div className="text-xl font-bold text-green-900">{sub.pastDueCount}</div>
            <div className="text-[11px] text-text-muted">Past Due</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gray-50">
            <div className="text-xl font-bold text-green-900">{sub.expiredCount}</div>
            <div className="text-[11px] text-text-muted">Expired</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
