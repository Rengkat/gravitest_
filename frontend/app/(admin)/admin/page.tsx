"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  DollarSign,
  CreditCard,
  HelpCircle,
  Bot,
  Settings,
  UserPlus,
  Receipt,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../components/StatCard";
import * as adminApi from "@/lib/api/admin-dashboard";
import * as aiAdminApi from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

interface ActivityItem {
  id: string;
  timestamp: number;
  description: string;
  detail: string;
  time: string;
  icon: typeof Users;
  iconBg: string;
  iconColor: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Compact naira for stat cards: ₦0, ₦850, ₦12.5K, ₦2.4M. The old
// `₦${(n / 1000).toFixed(0)}K` turned ₦0 into "₦0K" and ₦400 into "₦0K".
function formatNairaCompact(amount: number): string {
  const abs = Math.abs(amount);
  const trim = (n: number, digits: number) => n.toFixed(digits).replace(/\.0+$/, "");
  if (abs >= 1_000_000) return `₦${trim(amount / 1_000_000, abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `₦${trim(amount / 1_000, abs >= 100_000 ? 0 : 1)}K`;
  return `₦${Math.round(amount).toLocaleString("en-NG")}`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalProfessionals, setTotalProfessionals] = useState(0);
  const [questionStats, setQuestionStats] = useState<adminApi.QuestionBankStats | null>(null);
  const [subStats, setSubStats] = useState<adminApi.SubscriptionStats | null>(null);
  const [txnStats, setTxnStats] = useState<adminApi.TransactionStats | null>(null);
  const [aiCost, setAiCost] = useState<aiAdminApi.AiCostStats | null>(null);
  const [aiPerf, setAiPerf] = useState<aiAdminApi.AiPerformanceStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    Promise.allSettled([
      adminApi.listUsers({ limit: 1 }),
      adminApi.listUsers({ role: "student", limit: 1 }),
      adminApi.listUsers({ role: "professional_student", limit: 1 }),
      adminApi.getQuestionBankStats(),
      adminApi.getSubscriptionStats(),
      adminApi.getTransactionStats(),
      aiAdminApi.getCostStats(),
      aiAdminApi.getPerformanceStats(),
      adminApi.listUsers({ limit: 5, sortBy: "createdAt", sortOrder: "DESC" }),
      adminApi.listTransactions({ limit: 5, sortBy: "createdAt", sortOrder: "DESC" }),
    ]).then((results) => {
      const [
        all,
        students,
        professionals,
        qStats,
        sStats,
        tStats,
        cost,
        perf,
        recentUsers,
        recentTxns,
      ] = results;

      // Some of these (subscription/transaction stats) are restricted to
      // super_admin on the backend — an "admin" viewing this page will
      // get a 403 on just those calls. allSettled means the rest of the
      // dashboard still renders instead of the whole page failing; the
      // restricted cards just show a placeholder.
      if (all.status === "fulfilled") setTotalUsers(all.value.meta.totalItems);
      if (students.status === "fulfilled") setTotalStudents(students.value.meta.totalItems);
      if (professionals.status === "fulfilled")
        setTotalProfessionals(professionals.value.meta.totalItems);
      if (qStats.status === "fulfilled") setQuestionStats(qStats.value);
      if (sStats.status === "fulfilled") setSubStats(sStats.value);
      if (tStats.status === "fulfilled") setTxnStats(tStats.value);
      if (cost.status === "fulfilled") setAiCost(cost.value);
      if (perf.status === "fulfilled") setAiPerf(perf.value);

      const userActivity: ActivityItem[] =
        recentUsers.status === "fulfilled"
          ? recentUsers.value.data.map((u) => ({
              id: `user-${u.id}`,
              timestamp: new Date(u.createdAt).getTime(),
              description: `New ${u.role === "student" ? "student" : "user"} registered`,
              detail: `${u.firstName} ${u.lastName}`,
              time: timeAgo(u.createdAt),
              icon: UserPlus,
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-600",
            }))
          : [];
      const txnActivity: ActivityItem[] =
        recentTxns.status === "fulfilled"
          ? recentTxns.value.data
              .filter((t) => t.status === "success")
              .map((t) => ({
                id: `txn-${t.id}`,
                timestamp: new Date(t.createdAt).getTime(),
                description: "Payment received",
                detail: `₦${(t.amountKobo / 100).toLocaleString()} — ${t.description ?? t.type}`,
                time: timeAgo(t.createdAt),
                icon: CreditCard,
                iconBg: "bg-green-500/10",
                iconColor: "text-green-600",
              }))
          : [];
      // Newest first. (This used to compare the "5m ago" strings, which
      // doesn't order by time at all.)
      const merged = [...userActivity, ...txnActivity]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 6);
      setActivity(merged);

      // Only treat this as a page-level error if the core call (total
      // users) failed — individual restricted-metric failures are
      // handled per-card above instead.
      if (all.status === "rejected") setError(extractErrorMessage(all.reason));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center">
        <AlertTriangle size={32} className="mx-auto mb-3 text-red-400" />
        <p className="text-text-muted">Couldn&apos;t load the dashboard ({error}).</p>
      </div>
    );
  }

  const mrrNaira = (subStats?.estimatedMonthlyRecurringRevenueKobo ?? 0) / 100;
  const revenueThisMonth = (txnStats?.revenueThisMonthKobo ?? 0) / 100;
  const revenueLastMonth = (txnStats?.revenueLastMonthKobo ?? 0) / 100;
  const revenueChange =
    revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-green-900 mb-2">Platform Overview</h1>
        <p className="text-text-muted">
          Monitor platform performance, user activity, and key metrics in real-time.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers.toLocaleString()}
          color="#2e8b57"
        />
        <StatCard
          icon={DollarSign}
          label="This Month's Revenue"
          value={formatNairaCompact(revenueThisMonth)}
          color="#f5c842"
          trend={revenueChange}
        />
        <StatCard
          icon={TrendingUp}
          label="Est. Monthly Recurring Revenue"
          value={formatNairaCompact(mrrNaira)}
          color="#6366f1"
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={(subStats?.activeCount ?? 0).toLocaleString()}
          color="#f97316"
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-600" />
            <span className="text-[12px] text-text-muted">Total Users</span>
          </div>
          <div className="text-[22px] font-bold text-green-900">{totalUsers.toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-purple-600" />
            <span className="text-[12px] text-text-muted">Students</span>
          </div>
          <div className="text-[22px] font-bold text-green-900">{totalStudents.toLocaleString()}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-green-600" />
            <span className="text-[12px] text-text-muted">Professionals</span>
          </div>
          <div className="text-[22px] font-bold text-green-900">
            {totalProfessionals.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-orange-600" />
            <span className="text-[12px] text-text-muted">Question Bank</span>
          </div>
          <div className="text-[22px] font-bold text-green-900">
            {(questionStats?.total ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-green-900">Recent Activity</h2>
              <Link
                href="/admin/users"
                className="text-[12px] font-semibold text-green-600 hover:text-green-700">
                View All →
              </Link>
            </div>
            {activity.length === 0 ? (
              <p className="text-[13px] text-text-muted text-center py-6">No recent activity.</p>
            ) : (
              <div className="space-y-1">
                {activity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-cream transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                          <Icon size={16} className={item.iconColor} />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-green-900">
                            {item.description}
                          </div>
                          <div className="text-[11px] text-text-muted">{item.detail}</div>
                        </div>
                      </div>
                      <div className="text-[11px] text-text-muted">{item.time}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/users"
              className="p-5 rounded-2xl bg-gradient-to-r from-green-800 to-green-700 text-white group transition-all hover:scale-[1.02]">
              <Users size={24} className="mb-3" />
              <div className="text-[15px] font-semibold mb-1">Manage Users</div>
              <div className="text-[12px] text-white/60">View, search, and manage all users</div>
            </Link>

            <Link
              href="/admin/questions"
              className="p-5 rounded-2xl bg-gradient-to-r from-gold to-gold-dark text-green-900 group transition-all hover:scale-[1.02]">
              <HelpCircle size={24} className="mb-3" />
              <div className="text-[15px] font-semibold mb-1">Question Bank</div>
              <div className="text-[12px] text-green-900/60">Manage past questions</div>
            </Link>

            <Link
              href="/admin/settings"
              className="p-5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white group transition-all hover:scale-[1.02]">
              <Settings size={24} className="mb-3" />
              <div className="text-[15px] font-semibold mb-1">Settings</div>
              <div className="text-[12px] text-white/60">Platform configuration</div>
            </Link>
          </div>
        </div>

        {/* Right Column - AI Usage & Revenue breakdown */}
        <div className="space-y-6">
          {/* AI Usage Summary */}
          <div className="p-6 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Bot size={18} className="text-green-600" />
              <h2 className="font-serif text-xl text-green-900">AI Usage</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-text-muted">Total Requests</span>
                  <span className="font-semibold text-green-900">
                    {(aiPerf?.totalRequests ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-text-muted">Total Cost</span>
                  <span className="font-semibold text-green-900">
                    ${(aiCost?.totalCostUsd ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-text-muted">Success Rate</span>
                  <span className="font-semibold text-green-900">
                    {Math.round((aiPerf?.successRate ?? 0) * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="text-text-muted">Avg Response Time</span>
                  <span className="font-semibold text-green-900">
                    {aiPerf?.avgResponseTimeMs ?? 0}ms
                  </span>
                </div>
              </div>
              <Link
                href="/admin/ai-logs"
                className="w-full block text-center py-2 rounded-lg text-[12px] font-semibold transition-all"
                style={{ background: "rgba(26,74,46,0.08)", color: "#1a4a2e" }}>
                View AI Logs →
              </Link>
            </div>
          </div>

          {/* Revenue breakdown — real data, replaces a fabricated "System
              Status" panel that had no backend behind it */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-green-800 to-green-700 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Receipt size={18} />
              <h2 className="font-serif text-xl">Revenue Snapshot</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/70">Total Revenue (all time)</span>
                <span className="text-[13px] font-bold">
                  ₦{((txnStats?.totalRevenueKobo ?? 0) / 100).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/70">This Month</span>
                <span className="text-[13px] font-bold">₦{revenueThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/70">Active Subscriptions</span>
                <span className="text-[13px] font-bold">{subStats?.activeCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-white/70">Past Due</span>
                <span className="text-[13px] font-bold">{subStats?.pastDueCount ?? 0}</span>
              </div>
              <Link
                href="/admin/transactions"
                className="w-full block text-center py-2 rounded-lg text-[12px] font-semibold bg-white/10 hover:bg-white/20 transition-all mt-3">
                View Transactions →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
