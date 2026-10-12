"use client";

import { Search, Filter, FilterX } from "lucide-react";
import type { UserFilters, UserRole, SortField } from "../types";
import { ROLE_CONFIG } from "../constants";
import { FilterSelect } from "./Primitives";
import { NIGERIAN_STATES } from "@/lib/constants/profile";

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filters: UserFilters;
  setFilters: (f: UserFilters) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  sortField: SortField;
  setSortField: (f: SortField) => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (d: "asc" | "desc") => void;
  resultCount: number;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
}

export function SearchFilterBar({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  activeFilterCount,
  clearFilters,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  resultCount,
  showFilters,
  setShowFilters,
}: Props) {
  const set = <K extends keyof UserFilters>(key: K, value: UserFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-2xl border p-4 mb-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Search row */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-[14px] font-medium ${
              showFilters || activeFilterCount > 0
                ? "bg-green-800 text-white border-green-800"
                : "bg-white text-text-muted border-gray-200 hover:border-green-800/30"
            }`}>
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-yellow-400 text-green-900 text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all text-[14px] font-medium">
              <FilterX size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Role quick filter */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <button
          onClick={() => set("role", "")}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
            filters.role === "" ? "bg-green-800 text-white" : "bg-cream text-text-muted hover:bg-gray-100"
          }`}>
          All Users
        </button>
        {(Object.entries(ROLE_CONFIG) as [UserRole, (typeof ROLE_CONFIG)[UserRole]][]).map(
          ([role, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={role}
                onClick={() => set("role", role)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  filters.role === role ? "text-white" : "text-text-muted hover:bg-gray-100"
                }`}
                style={filters.role === role ? { background: cfg.color } : { background: cfg.bg }}>
                <Icon size={13} style={{ color: filters.role === role ? "#fff" : cfg.color }} />
                {cfg.label}
              </button>
            );
          },
        )}
      </div>

      {/* Collapsible filters */}
      {showFilters && (
        <div
          className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <FilterSelect
            label="Status"
            value={filters.isActive}
            onChange={(v) => set("isActive", v as UserFilters["isActive"])}
            options={[
              { value: "", label: "All Statuses" },
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
          <FilterSelect
            label="Verification"
            value={filters.emailVerified}
            onChange={(v) => set("emailVerified", v as UserFilters["emailVerified"])}
            options={[
              { value: "", label: "All" },
              { value: "true", label: "Verified" },
              { value: "false", label: "Unverified" },
            ]}
          />
          <FilterSelect
            label="State"
            value={filters.state}
            onChange={(v) => set("state", v)}
            options={[{ value: "", label: "All States" }, ...NIGERIAN_STATES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Gender"
            value={filters.gender}
            onChange={(v) => set("gender", v)}
            options={[
              { value: "", label: "All" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-2">Joined From</label>
            <input
              title="filter"
              type="date"
              value={filters.createdFrom}
              onChange={(e) => set("createdFrom", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-2">Joined To</label>
            <input
              title="filter"
              type="date"
              value={filters.createdTo}
              onChange={(e) => set("createdTo", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
        </div>
      )}

      {/* Results + sort */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[13px] text-text-muted">
          Showing <span className="font-semibold text-green-900">{resultCount.toLocaleString()}</span>{" "}
          users
        </span>
        <div className="flex items-center gap-2">
          <select
            title="sort"
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-text-muted focus:outline-none">
            <option value="joinDate">Sort: Joined</option>
            <option value="name">Sort: Name</option>
            <option value="email">Sort: Email</option>
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
