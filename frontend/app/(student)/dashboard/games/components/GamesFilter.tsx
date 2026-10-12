"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";
import { CATEGORIES, DIFFICULTIES } from "@/lib/constants/games";

interface GamesFilterProps {
  searchQuery: string;
  selectedCategory: string;
  selectedDifficulty: string;
  onSearchChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onDifficultyChange: (v: string) => void;
}

export default function GamesFilter({
  searchQuery,
  selectedCategory,
  selectedDifficulty,
  onSearchChange,
  onCategoryChange,
  onDifficultyChange,
}: GamesFilterProps) {
  const hasFilters = searchQuery || selectedCategory !== "All" || selectedDifficulty !== "All";

  const clearAll = () => {
    onSearchChange("");
    onCategoryChange("All");
    onDifficultyChange("All");
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-5 mb-8">
      {/* Search + clear */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search games, categories, tags..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-9 py-3 bg-gray-800 border border-gray-700 text-white rounded-xl text-[14px] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 placeholder:text-gray-600 transition-all"
          />
          {searchQuery && (
            <button
              title="on serch"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <X size={15} />
            </button>
          )}
        </div>

        {hasFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-700 text-[13px] text-gray-400 hover:text-white hover:border-gray-600 transition-all">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <SlidersHorizontal size={11} /> Category
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white"
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
          Difficulty
        </p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => {
            const colors: Record<string, string> = {
              All: "bg-emerald-500 text-white shadow-emerald-500/25",
              Beginner: "bg-emerald-500/90 text-white shadow-emerald-500/25",
              Intermediate: "bg-amber-500/90 text-white shadow-amber-500/25",
              Advanced: "bg-orange-500/90 text-white shadow-orange-500/25",
              Expert: "bg-red-500/90 text-white shadow-red-500/25",
            };
            const active = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                onClick={() => onDifficultyChange(diff)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
                  active
                    ? `${colors[diff] ?? "bg-gray-700 text-white"} shadow-lg`
                    : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600 hover:text-white"
                }`}>
                {diff}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
