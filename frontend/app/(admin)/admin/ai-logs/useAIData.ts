"use client";

import { useState, useEffect, useCallback } from "react";
import * as aiAdminApi from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

// ── Display shapes kept close to the original mock interfaces so existing
// components (AICostAnalytics, AIPerformanceMonitor, FlaggedConversations)
// need minimal changes — these are populated from real backend aggregation
// queries (AiAdminService.getCostStats/getPerformanceStats) rather than
// fabricated numbers. A few fields that have no clean single backend query
// (activeUsers, averageRating, recentActivity) are computed client-side
// from a sample of recent conversations — see comments below for exactly
// what's approximated vs precise.

interface AIStats {
  totalSessions: number;
  activeUsers: number; // distinct userId within the last 100 conversations, not global — see fetchData
  averageRating: number; // avg of userRating across the same sample, not global
  flaggedCount: number;
  featureUsage: { name: string; count: number; cost: number }[];
  recentActivity: {
    id: string;
    userName: string; // shows a short userId — no bulk name-resolution endpoint wired up yet
    feature: string;
    preview: string; // conversation title, not message content (title is what the backend stores)
    time: string;
    cost: number;
  }[];
}

interface AICostStats {
  totalCostUsd: number;
  costToday: number;
  costByFeature: { feature: string; cost: number; percentage: number }[];
  costByModel: { model: string; cost: number }[];
  costByUser: { userId: string; costUsd: number }[];
}

interface AIPerformanceStats {
  totalRequests: number;
  avgResponseTime: number;
  successRate: number;
  fallbackRate: number;
  errorsByModel: Record<string, number>;
}

interface FlaggedSession {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  severity: "low" | "medium" | "high"; // no severity field on the backend — see mapping below
  timestamp: string;
  messages: { id: string; content: string; role: string; flagReason: string; timestamp: string }[];
  status: "pending" | "reviewed" | "dismissed";
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

export function useAIData() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [costStats, setCostStats] = useState<AICostStats | null>(null);
  const [performanceStats, setPerformanceStats] = useState<AIPerformanceStats | null>(null);
  const [flaggedSessions, setFlaggedSessions] = useState<FlaggedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cost, perf, recent, flagged] = await Promise.all([
        aiAdminApi.getCostStats(),
        aiAdminApi.getPerformanceStats(),
        aiAdminApi.listConversations({ limit: 100, sortBy: "lastActivityAt", sortOrder: "DESC" }),
        aiAdminApi.listConversations({ flagged: true, limit: 50, sortBy: "lastActivityAt", sortOrder: "DESC" }),
      ]);

      // Cost stats -> display shape
      const totalFeatureCost = Object.values(cost.costByFeature).reduce((a, b) => a + b, 0);
      setCostStats({
        totalCostUsd: cost.totalCostUsd,
        costToday: cost.costToday,
        costByFeature: Object.entries(cost.costByFeature)
          .map(([feature, c]) => ({ feature, cost: c, percentage: pct(c, totalFeatureCost) }))
          .sort((a, b) => b.cost - a.cost),
        costByModel: Object.entries(cost.costByModel)
          .map(([model, c]) => ({ model, cost: c }))
          .sort((a, b) => b.cost - a.cost),
        costByUser: cost.topUsersByCost,
      });

      // Performance stats -> display shape
      setPerformanceStats({
        totalRequests: perf.totalRequests,
        avgResponseTime: perf.avgResponseTimeMs,
        successRate: Math.round(perf.successRate * 1000) / 10,
        fallbackRate: Math.round(perf.fallbackRate * 1000) / 10,
        errorsByModel: perf.errorsByModel,
      });

      // Overview stats derived from the recent-conversations sample
      const distinctUsers = new Set(recent.data.map((c) => c.userId));
      const ratings = recent.data.map((c) => c.userRating).filter((r): r is number => r != null);
      const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      const featureCounts = new Map<string, { count: number; cost: number }>();
      for (const c of recent.data) {
        const entry = featureCounts.get(c.feature) ?? { count: 0, cost: 0 };
        entry.count += 1;
        entry.cost += c.totalCostUsd;
        featureCounts.set(c.feature, entry);
      }

      setStats({
        totalSessions: recent.meta.totalItems,
        activeUsers: distinctUsers.size,
        averageRating: avgRating,
        flaggedCount: flagged.meta.totalItems,
        featureUsage: Array.from(featureCounts.entries())
          .map(([name, v]) => ({ name, count: v.count, cost: v.cost }))
          .sort((a, b) => b.count - a.count),
        recentActivity: recent.data.slice(0, 10).map((c) => ({
          id: c.id,
          userName: `User ${c.userId.slice(0, 8)}`,
          feature: c.feature,
          preview: c.title ?? "(untitled conversation)",
          time: c.lastActivityAt ? new Date(c.lastActivityAt).toLocaleString() : "—",
          cost: c.totalCostUsd,
        })),
      });

      // Flagged conversations -> display shape. Backend has no severity
      // field — everything maps to "medium" rather than fabricating a
      // risk score. status is derived from isFlagged (flagged ones are
      // always "pending" here since unflag() removes them from this list).
      setFlaggedSessions(
        flagged.data.map((c) => ({
          id: c.id,
          userId: c.userId,
          userName: `User ${c.userId.slice(0, 8)}`,
          reason: c.flagReason ?? "Flagged by automated content review",
          severity: "medium",
          timestamp: c.lastActivityAt ?? c.createdAt,
          messages: (c.messages ?? []).map((m) => ({
            id: m.id,
            content: m.content,
            role: m.role,
            flagReason: "",
            timestamp: m.createdAt,
          })),
          status: "pending",
        })),
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const unflagSession = useCallback(async (id: string) => {
    await aiAdminApi.unflagConversation(id);
    setFlaggedSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    stats,
    costStats,
    performanceStats,
    flaggedSessions,
    loading,
    error,
    refreshData,
    unflagSession,
  };
}
