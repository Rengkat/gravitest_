"use client";

import { Search, X, Grid3x3, List, SlidersHorizontal, ChevronDown } from "lucide-react";
import { SortMode, ViewMode, LibraryFilters, Subject, Level, ExamType } from "@/types/library";
import { SUBJECTS, LEVELS, EXAM_TYPES } from "@/lib/constants/library";

interface SearchBarProps {
  filters: LibraryFilters;
  viewMode: ViewMode;
  showFilters: boolean;
  activeFilterCount: number;
  onSearchChange: (q: string) => void;
  onSortChange: (s: SortMode) => void;
  onViewModeChange: (v: ViewMode) => void;
  onToggleFilters: () => void;
  onSubjectChange: (s: Subject) => void;
  onLevelChange: (l: Level) => void;
  onExamChange: (e: ExamType) => void;
  onClearFilters: () => void;
}

export default function SearchBar({
  filters,
  viewMode,
  showFilters,
  activeFilterCount,
  onSearchChange,
  onSortChange,
  onViewModeChange,
  onToggleFilters,
  onSubjectChange,
  onLevelChange,
  onExamChange,
  onClearFilters,
}: SearchBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources, topics, tags..."
            value={filters.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all"
          />
          {filters.searchQuery && (
            <button
              title="clear search"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={15} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(["latest", "popular", "rating"] as SortMode[]).map((s) => (
            <button
              key={s}
              onClick={() => onSortChange(s)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${
                filters.sortMode === s
                  ? "bg-white shadow-sm text-green-800"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            title="grid view"
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-green-700" : "text-gray-500"}`}>
            <Grid3x3 size={16} />
          </button>
          <button
            title="list view"
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-green-700" : "text-gray-500"}`}>
            <List size={16} />
          </button>
        </div>

        {/* Filter toggle */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all ${
            showFilters || activeFilterCount > 0
              ? "border-green-500 bg-green-50 text-green-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}>
          <SlidersHorizontal size={15} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Subject
              </label>
              <select
                title="filter by subject"
                value={filters.subject}
                onChange={(e) => onSubjectChange(e.target.value as Subject)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400">
                {SUBJECTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Level
              </label>
              <select
                title="filter by level"
                value={filters.level}
                onChange={(e) => onLevelChange(e.target.value as Level)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400">
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                Exam Type
              </label>
              <select
                title="filter by exam type"
                value={filters.examType}
                onChange={(e) => onExamChange(e.target.value as ExamType)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400">
                {EXAM_TYPES.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Free / Premium quick filters */}
          <div className="flex gap-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showFreeOnly}
                onChange={() => {}}
                className="w-4 h-4 rounded accent-green-600"
              />
              <span className="text-[12px] font-semibold text-gray-600">Free only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.showPremiumOnly}
                onChange={() => {}}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="text-[12px] font-semibold text-gray-600">Premium only</span>
            </label>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={onClearFilters}
              className="mt-3 text-[12px] text-red-500 hover:text-red-600 font-semibold flex items-center gap-1.5 transition-colors">
              <X size={13} /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
