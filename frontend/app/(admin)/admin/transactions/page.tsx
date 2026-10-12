"use client";

import { List, LayoutGrid, BarChart3, Download, Loader2, AlertTriangle, Receipt, CreditCard } from "lucide-react";
import { useTransactions } from "./useTransactions";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { TransactionRow } from "./components/TransactionRow";
import { SubscriptionsTable } from "./components/SubscriptionsTable";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { MiniStatCard, Pagination } from "./components/Primitives";
import type { ViewMode } from "./types";

export default function TransactionsPage() {
  const {
    viewMode,
    setViewMode,
    transactions,
    txTotal,
    txTotalPages,
    txPage,
    setTxPage,
    subscriptions,
    subTotal,
    subTotalPages,
    subPage,
    setSubPage,
    stats,
    loading,
    error,
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    exportCsv,
  } = useTransactions();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl text-green-900 mb-2">Transactions</h1>
          <p className="text-text-muted">Payment history, subscriptions, and revenue.</p>
        </div>
        {viewMode === "transactions" && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-cream transition-all text-[14px] font-medium text-text-muted">
            <Download size={16} /> Export Page
          </button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MiniStatCard
            icon={Receipt}
            label="Total Revenue"
            value={`₦${(stats.txn.totalRevenueKobo / 100 / 1000).toFixed(0)}K`}
            color="#2e8b57"
          />
          <MiniStatCard
            icon={Receipt}
            label="This Month"
            value={`₦${(stats.txn.revenueThisMonthKobo / 100 / 1000).toFixed(0)}K`}
            color="#0284c7"
          />
          <MiniStatCard
            icon={CreditCard}
            label="Active Subs"
            value={stats.sub.activeCount.toLocaleString()}
            color="#8b5cf6"
          />
          <MiniStatCard
            icon={CreditCard}
            label="Est. MRR"
            value={`₦${(stats.sub.estimatedMonthlyRecurringRevenueKobo / 100 / 1000).toFixed(0)}K`}
            color="#f97316"
          />
        </div>
      )}

      <div className="flex items-center gap-2 mb-6">
        {(
          [
            { mode: "transactions" as ViewMode, Icon: List, label: "Transactions" },
            { mode: "subscriptions" as ViewMode, Icon: LayoutGrid, label: "Subscriptions" },
            { mode: "analytics" as ViewMode, Icon: BarChart3, label: "Analytics" },
          ]
        ).map(({ mode, Icon, label }) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all flex items-center gap-2 ${
              viewMode === mode ? "bg-green-800 text-white" : "bg-white border border-gray-200 text-text-muted hover:bg-cream"
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {viewMode === "analytics" && stats && <AnalyticsDashboard stats={stats} />}

      {viewMode === "transactions" && (
        <>
          <SearchFilterBar
            filters={filters}
            setFilters={setFilters}
            activeFilterCount={activeFilterCount}
            clearFilters={clearFilters}
            sortField={sortField}
            setSortField={setSortField}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            resultCount={txTotal}
          />

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 size={24} className="animate-spin text-green-800" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <AlertTriangle size={28} className="mx-auto mb-3 text-red-400" />
              <p className="text-text-muted">Couldn&apos;t load transactions ({error}).</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-[14px]">
              No transactions match your current filters.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {transactions.map((t) => (
                  <TransactionRow key={t.id} transaction={t} />
                ))}
              </div>
              <Pagination currentPage={txPage} totalPages={txTotalPages} onChange={setTxPage} />
            </>
          )}
        </>
      )}

      {viewMode === "subscriptions" && (
        <SubscriptionsTable
          subscriptions={subscriptions}
          loading={loading}
          error={error}
          currentPage={subPage}
          totalPages={subTotalPages}
          onPageChange={setSubPage}
        />
      )}
    </div>
  );
}
