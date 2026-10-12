"use client";

import { useState, useEffect, useCallback } from "react";
import type { ViewMode, TransactionFilters, SortField } from "./types";
import * as adminApi from "@/lib/api/admin-dashboard";
import { extractErrorMessage } from "@/lib/api/client";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: TransactionFilters = { status: "", type: "", gateway: "", search: "", from: "", to: "" };

export function useTransactions() {
  const [viewMode, setViewMode] = useState<ViewMode>("transactions");

  const [transactions, setTransactions] = useState<adminApi.AdminTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [subscriptions, setSubscriptions] = useState<adminApi.AdminSubscription[]>([]);
  const [subTotal, setSubTotal] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subPage, setSubPage] = useState(1);

  const [stats, setStats] = useState<{
    txn: adminApi.TransactionStats;
    sub: adminApi.SubscriptionStats;
  } | null>(null);

  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const SORT_MAP: Record<SortField, string> = { date: "createdAt", amount: "amountKobo", status: "createdAt" };

  useEffect(() => {
    if (viewMode !== "transactions") return;
    setLoading(true);
    setError(null);
    adminApi
      .listTransactions({
        status: filters.status || undefined,
        type: filters.type || undefined,
        gateway: filters.gateway || undefined,
        search: filters.search || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page: txPage,
        limit: PAGE_SIZE,
        sortBy: SORT_MAP[sortField],
        sortOrder: sortDirection === "asc" ? "ASC" : "DESC",
      })
      .then((res) => {
        setTransactions(res.data);
        setTxTotal(res.meta.totalItems);
        setTxTotalPages(res.meta.totalPages || 1);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [viewMode, filters, sortField, sortDirection, txPage, refreshKey]);

  useEffect(() => {
    if (viewMode !== "subscriptions") return;
    setLoading(true);
    setError(null);
    adminApi
      .listSubscriptions({ page: subPage, limit: PAGE_SIZE })
      .then((res) => {
        setSubscriptions(res.data);
        setSubTotal(res.meta.totalItems);
        setSubTotalPages(res.meta.totalPages || 1);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [viewMode, subPage, refreshKey]);

  useEffect(() => {
    Promise.allSettled([adminApi.getTransactionStats(), adminApi.getSubscriptionStats()]).then(
      ([txn, sub]) => {
        if (txn.status === "fulfilled" && sub.status === "fulfilled") {
          setStats({ txn: txn.value, sub: sub.value });
        }
      },
    );
  }, [refreshKey]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;
  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  function exportCsv() {
    const headers = ["ID", "Reference", "Amount (NGN)", "Status", "Gateway", "Channel", "Type", "Date"];
    const rows = transactions.map((t) => [
      t.id,
      t.reference,
      (t.amountKobo / 100).toFixed(2),
      t.status,
      t.gateway ?? "",
      t.channel ?? "",
      t.type,
      t.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
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
    refresh,
  };
}
