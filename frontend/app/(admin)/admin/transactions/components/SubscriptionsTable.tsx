"use client";

import { Loader2, AlertTriangle, User } from "lucide-react";
import type { AdminSubscription } from "@/lib/api/admin-dashboard";
import { TIER_CONFIG } from "../constants";
import { Card, Pagination } from "./Primitives";

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active: { color: "#10b981", bg: "#d1fae5" },
  trial: { color: "#0284c7", bg: "#dbeafe" },
  past_due: { color: "#f59e0b", bg: "#fef3c7" },
  expired: { color: "#9ca3af", bg: "#f3f4f6" },
  cancelled: { color: "#ef4444", bg: "#fee2e2" },
  pending: { color: "#f59e0b", bg: "#fef3c7" },
};

export function SubscriptionsTable({
  subscriptions,
  loading,
  error,
  currentPage,
  totalPages,
  onPageChange,
}: {
  subscriptions: AdminSubscription[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-green-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
        <p className="text-text-muted">Couldn&apos;t load subscriptions ({error}).</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return <div className="text-center py-16 text-text-muted text-[14px]">No subscriptions found.</div>;
  }

  return (
    <>
      <div className="space-y-3">
        {subscriptions.map((sub) => {
          const tierCfg = TIER_CONFIG[sub.tier];
          const statusColor = STATUS_COLORS[sub.status] ?? STATUS_COLORS.pending;
          const TierIcon = tierCfg?.icon ?? User;
          return (
            <Card key={sub.id} className="p-4 flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${tierCfg?.color ?? "#9ca3af"}18` }}>
                <TierIcon size={18} style={{ color: tierCfg?.color ?? "#9ca3af" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[14px] font-semibold text-green-900">
                    {sub.user ? `${sub.user.firstName} ${sub.user.lastName}` : sub.id}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: statusColor.bg, color: statusColor.color }}>
                    {sub.status.replace("_", " ")}
                  </span>
                </div>
                <div className="text-[12px] text-text-muted flex items-center gap-3 flex-wrap">
                  <span>{sub.user?.email}</span>
                  <span>·</span>
                  <span>{tierCfg?.label ?? sub.tier}</span>
                  {sub.billingInterval && (
                    <>
                      <span>·</span>
                      <span>{sub.billingInterval}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>Started {new Date(sub.startedAt).toLocaleDateString("en-NG")}</span>
                  {sub.expiresAt && (
                    <>
                      <span>·</span>
                      <span>Renews {new Date(sub.expiresAt).toLocaleDateString("en-NG")}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold text-green-900">
                  ₦{(sub.amountKobo / 100).toLocaleString()}
                </p>
                <p className="text-[11px] text-text-muted">{sub.autoRenew ? "Auto-renews" : "Manual"}</p>
              </div>
            </Card>
          );
        })}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onChange={onPageChange} />
    </>
  );
}
