"use client";

import { Search } from "lucide-react";
import type { TransactionFilters, SortField } from "../types";
import { TX_STATUS_CONFIG, TYPE_CONFIG } from "../constants";
import { FilterSelect } from "./Primitives";
import { useAdminGateways } from "@/lib/hooks/useBillingAdmin";
import { gatewayLabel } from "@/lib/billing/gateways";

interface Props {
  filters: TransactionFilters;
  setFilters: (f: TransactionFilters) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  sortField: SortField;
  setSortField: (f: SortField) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (d: "asc" | "desc") => void;
  resultCount: number;
}

export function SearchFilterBar({
  filters,
  setFilters,
  activeFilterCount,
  clearFilters,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  resultCount,
}: Props) {
  const set = <K extends keyof TransactionFilters>(key: K, value: TransactionFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  // Options come from the gateways the admin has configured, so a newly added
  // gateway is filterable with no code change. Before they load (or if the call
  // fails) fall back to the two that exist today.
  const { data: gatewayConfigs } = useAdminGateways();
  const gatewayOptions = (gatewayConfigs?.map((g) => g.code) ?? ["paystack", "opay"]).map((code) => ({
    value: code,
    label: gatewayLabel(code),
  }));

  return (
    <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by reference or user ID…"
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
          />
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all text-[14px] font-medium">
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => set("status", v as TransactionFilters["status"])}
          options={[
            { value: "", label: "All Statuses" },
            ...Object.entries(TX_STATUS_CONFIG).map(([k, c]) => ({ value: k, label: c.label })),
          ]}
        />
        <FilterSelect
          label="Type"
          value={filters.type}
          onChange={(v) => set("type", v as TransactionFilters["type"])}
          options={[
            { value: "", label: "All Types" },
            ...Object.entries(TYPE_CONFIG).map(([k, c]) => ({ value: k, label: c.label })),
          ]}
        />
        <FilterSelect
          label="Gateway"
          value={filters.gateway}
          onChange={(v) => set("gateway", v)}
          options={[{ value: "", label: "All Gateways" }, ...gatewayOptions]}
        />
        <div>
          <label className="block text-[12px] font-semibold text-green-900 mb-2">From</label>
          <input
            title="from"
            type="date"
            value={filters.from}
            onChange={(e) => set("from", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-green-900 mb-2">To</label>
          <input
            title="to"
            type="date"
            value={filters.to}
            onChange={(e) => set("to", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-[13px] text-text-muted">
          Showing <span className="font-semibold text-green-900">{resultCount.toLocaleString()}</span>{" "}
          transactions
        </span>
        <div className="flex items-center gap-2">
          <select
            title="sort"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-text-muted focus:outline-none">
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-text-muted hover:bg-cream transition-colors">
            {sortDirection === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>
    </div>
  );
}
