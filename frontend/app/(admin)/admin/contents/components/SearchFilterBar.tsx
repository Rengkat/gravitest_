"use client";

import { Search, Filter, FilterX, RefreshCw } from "lucide-react";
import type {
  ContentFilters,
  ContentType,
  AccessLevel,
  SubjectCategory,
  ContentStatus,
  ContentAudience,
  ExamTarget,
  SortField,
} from "@/types/admin-contents";
import {
  CONTENT_TYPES,
  ACCESS_LEVELS,
  STATUS_MAP,
  SUBJECTS,
  SECONDARY_EXAMS,
  PROFESSIONAL_EXAMS,
} from "@/lib/constants/contents";
import { FilterSelect } from "./SharedPrimitives";

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filters: ContentFilters;
  setFilters: (f: ContentFilters) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  sortField: SortField;
  setSortField: (f: SortField) => void;
  resultCount: number;
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  onRefresh: () => void;
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
  resultCount,
  showFilters,
  setShowFilters,
  onRefresh,
}: Props) {
  const set = <K extends keyof ContentFilters>(key: K, value: ContentFilters[K]) =>
    setFilters({ ...filters, [key]: value });

  const allExamOptions = [
    { value: "", label: "All Exams" },
    { value: "---secondary", label: "── Secondary ──", disabled: true },
    ...Object.entries(SECONDARY_EXAMS).map(([k, v]) => ({ value: k, label: v.label })),
    { value: "---professional", label: "── Professional ──", disabled: true },
    ...Object.entries(PROFESSIONAL_EXAMS).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  return (
    <div
      className="bg-white rounded-2xl border p-4 mb-6"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Top row */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by title, description, author, or tags…"
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
          <button
            onClick={onRefresh}
            className="p-3 rounded-xl border border-gray-200 text-text-muted hover:bg-cream transition-all"
            title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div
          className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <FilterSelect
            label="Content Type"
            value={filters.type}
            onChange={(v) => set("type", v as ContentType)}
            options={[
              { value: "", label: "All Types" },
              ...Object.entries(CONTENT_TYPES).map(([k, c]) => ({ value: k, label: c.label })),
            ]}
          />
          <FilterSelect
            label="Audience"
            value={filters.audience}
            onChange={(v) => set("audience", v as ContentAudience)}
            options={[
              { value: "", label: "All Audiences" },
              { value: "secondary", label: "Secondary School" },
              { value: "professional", label: "Professional" },
            ]}
          />
          <FilterSelect
            label="Exam"
            value={filters.examTarget}
            onChange={(v) => set("examTarget", v as ExamTarget)}
            options={allExamOptions}
          />
          <FilterSelect
            label="Subject"
            value={filters.subject}
            onChange={(v) => set("subject", v as SubjectCategory)}
            options={[
              { value: "", label: "All Subjects" },
              ...Object.entries(SUBJECTS)
                .filter(([k]) => k !== "all")
                .map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
          <FilterSelect
            label="Access Level"
            value={filters.accessLevel}
            onChange={(v) => set("accessLevel", v as AccessLevel)}
            options={[
              { value: "", label: "All Access" },
              ...Object.entries(ACCESS_LEVELS).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(v) => set("status", v as ContentStatus)}
            options={[
              { value: "", label: "All Status" },
              ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
          <FilterSelect
            label="Pricing"
            value={filters.isFree}
            onChange={(v) => set("isFree", v)}
            options={[
              { value: "", label: "All Pricing" },
              { value: "true", label: "Free" },
              { value: "false", label: "Paid" },
            ]}
          />
          <FilterSelect
            label="Featured"
            value={filters.isFeatured}
            onChange={(v) => set("isFeatured", v)}
            options={[
              { value: "", label: "All" },
              { value: "true", label: "Featured Only" },
            ]}
          />
        </div>
      )}

      {/* Result count + sort */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[13px] text-text-muted">
          Showing{" "}
          <span className="font-semibold text-green-900">{resultCount.toLocaleString()}</span> items
        </span>
        <select
          title="sort"
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] text-text-muted focus:outline-none">
          <option value="dateAdded">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="views">Sort by Views</option>
          <option value="downloads">Sort by Downloads</option>
          <option value="rating">Sort by Rating</option>
          <option value="revenue">Sort by Revenue</option>
        </select>
      </div>
    </div>
  );
}
