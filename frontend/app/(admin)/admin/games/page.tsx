"use client";

import { useState } from "react";
import { Gamepad2, Plus, Search, RefreshCw, Users, Brain, Star, Activity } from "lucide-react";
import { useGames } from "./useGames";
import { GameCard } from "./components/GameCard";
import { GameSettingsPanel } from "./components/GameSettingsPanel";
import { GameAnalyticsPanel } from "./components/GameAnalyticsPanel";
import { QuestionsPanel } from "./components/QuestionsPanel";
import { MiniStatCard } from "./components/Primitives";
import { CATEGORY_CONFIG, STATUS_CONFIG } from "./constants";
import type { GameCategory, GameStatus, ViewMode } from "./types";

export default function AdminGamesPage() {
  const {
    filteredGames,
    filters,
    setFilters,
    stats,
    selectedGame,
    viewMode,
    setViewMode,
    saveSettings,
    updateGameStatus,
    openGame,
    closeGame,
  } = useGames();

  const showDetail = !!selectedGame && viewMode !== "overview";

  return (
    <div className="max-w-7xl mx-auto">
      {/* ─── PAGE HEADER ─── */}
      <div className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl text-green-900 mb-2">Game Management</h1>
            <p className="text-text-muted">
              Manage all educational games, content banks and game settings.
            </p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-800 text-white hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-semibold text-sm">
            <Plus size={18} /> Add New Game
          </button>
        </div>
      </div>

      {/* ─── SUMMARY STATS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <MiniStatCard
          icon={Gamepad2}
          label="Total Games"
          value={stats.totalGames}
          color="#2e8b57"
        />
        <MiniStatCard
          icon={Activity}
          label="Active Games"
          value={stats.activeGames}
          color="#10b981"
        />
        <MiniStatCard
          icon={Users}
          label="Total Plays"
          value={stats.totalPlays.toLocaleString()}
          color="#3b82f6"
        />
        <MiniStatCard
          icon={Brain}
          label="Total Questions"
          value={stats.totalQuestions.toLocaleString()}
          color="#8b5cf6"
        />
        <MiniStatCard
          icon={Star}
          label="Avg Score"
          value={stats.avgScore.toLocaleString()}
          color="#f59e0b"
        />
        <MiniStatCard
          icon={Activity}
          label="Avg Completion"
          value={`${stats.avgCompletion}%`}
          color="#ef4444"
        />
      </div>

      {/* ─── FILTERS ─── */}
      <div
        className="bg-white rounded-2xl border p-4 mb-6"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search games…"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <select
            title="category"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value as GameCategory | "" })
            }
            className="px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Categories</option>
            {(Object.keys(CATEGORY_CONFIG) as GameCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_CONFIG[c].label}
              </option>
            ))}
          </select>
          <select
            title="status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as GameStatus | "" })}
            className="px-4 py-3 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30">
            <option value="">All Statuses</option>
            {(Object.keys(STATUS_CONFIG) as GameStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ search: "", category: "", status: "" })}
            className="flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition text-[14px] font-medium text-text-muted">
            <RefreshCw size={16} /> Reset
          </button>
        </div>
      </div>

      {/* ─── MAIN LAYOUT ─── */}
      <div className={`${showDetail ? "grid grid-cols-1 lg:grid-cols-5 gap-6" : ""}`}>
        {/* Game grid */}
        <div className={showDetail ? "lg:col-span-2" : ""}>
          {filteredGames.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-[14px]">
              No games match your filters.
            </div>
          ) : (
            <div
              className={`grid gap-4 ${showDetail ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"}`}>
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} onOpen={openGame} />
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {showDetail && selectedGame && (
          <div className="lg:col-span-3">
            {viewMode === "settings" && (
              <GameSettingsPanel
                game={selectedGame}
                onSave={saveSettings}
                onStatusChange={updateGameStatus}
                onClose={closeGame}
              />
            )}
            {viewMode === "analytics" && (
              <GameAnalyticsPanel game={selectedGame} onClose={closeGame} />
            )}
            {viewMode === "questions" && <QuestionsPanel game={selectedGame} onClose={closeGame} />}
          </div>
        )}
      </div>
    </div>
  );
}
