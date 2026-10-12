"use client";

import { Clock, FileText } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/constants/billing";
import type { SubscriptionHistory as SubscriptionHistoryEntry, Transaction } from "@/types/billing";

// ── Subscription History ──────────────────────────────────────────────────

const SUB_STATUS_CONFIG = {
  active: { label: "Active", cls: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  expired: { label: "Expired", cls: "bg-red-100 text-red-600 border-red-200" },
};

interface SubscriptionHistoryProps {
  history: SubscriptionHistoryEntry[];
}

export function SubscriptionHistory({ history }: SubscriptionHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Clock size={18} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">Subscription History</h3>
          <p className="text-[12px] text-gray-500">All plan changes over time</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gray-200" />

        <div className="space-y-4">
          {history.map((h) => {
            const statusCfg = SUB_STATUS_CONFIG[h.status];
            return (
              <div key={h.id} className="flex gap-4">
                {/* Dot */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                    h.status === "active" ? "bg-green-100 border-green-400" : "bg-gray-100 border-gray-300"
                  }`}>
                  <div
                    className={`w-3 h-3 rounded-full ${h.status === "active" ? "bg-green-500" : "bg-gray-400"}`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-[14px] font-bold text-gray-800">{h.plan}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500">
                      {formatDate(h.startDate)} — {h.endDate ? formatDate(h.endDate) : "Present"}
                    </p>
                  </div>
                  <p className="text-[14px] font-black text-gray-900 shrink-0 ml-4">
                    {h.amount === 0 ? "Free" : `${formatCurrency(h.amount)}/${h.period === "Monthly" ? "mo" : "yr"}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Content Purchases ─────────────────────────────────────────────────────
// The backend has a reserved TransactionType.CONTENT_PURCHASE, but no
// actual "buy this library item" flow exists in the Library module yet —
// so this list is real (filters real transactions by type) but will be
// empty until that purchase flow is built. Rendered generically from
// transaction fields rather than a fabricated title/downloadUrl/watchUrl
// shape, since none of that exists on a real transaction record.

interface ContentPurchasesProps {
  transactions: Transaction[]; // pre-filtered to content_purchase type by the caller
}

export function ContentPurchases({ transactions }: ContentPurchasesProps) {
  if (transactions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
          <FileText size={18} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">Content Purchases</h3>
          <p className="text-[12px] text-gray-500">One-time digital content you've bought</p>
        </div>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:border-gray-200 transition-all">
            <div className="w-11 h-11 rounded-full bg-purple-50 border border-gray-200 flex items-center justify-center shadow-sm text-xl shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-gray-800 truncate">{tx.description}</p>
              <p className="text-[12px] text-gray-500 mt-0.5">{formatDate(tx.date)}</p>
            </div>
            <p className="text-[14px] font-black text-gray-900 shrink-0">{formatCurrency(tx.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
