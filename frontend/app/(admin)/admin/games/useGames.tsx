"use client";

import { useState, useMemo, useCallback } from "react";
import type {
  Game,
  GameSettings,
  GameSlug,
  GameCategory,
  GameStatus,
  GameFilters,
  ViewMode,
} from "./types";
import { MOCK_GAMES, GAME_CONFIGS } from "./constants";

export function useGames() {
  const [games, setGames] = useState<Game[]>(MOCK_GAMES);
  const [filters, setFilters] = useState<GameFilters>({ category: "", status: "", search: "" });
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");

  // ─── FILTERED GAMES ──────────────────────────────────────
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (filters.search && !g.name.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
      if (filters.category && g.category !== filters.category) return false;
      if (filters.status && g.status !== filters.status) return false;
      return true;
    });
  }, [games, filters]);

  // ─── AGGREGATE STATS ─────────────────────────────────────
  const stats = useMemo(
    () => ({
      totalGames: games.length,
      activeGames: games.filter((g) => g.status === "active").length,
      totalPlays: games.reduce((s, g) => s + g.totalPlays, 0),
      totalQuestions: games.reduce((s, g) => s + g.questionsCount, 0),
      avgScore: Math.round(games.reduce((s, g) => s + g.avgScore, 0) / games.length),
      avgCompletion: Math.round(games.reduce((s, g) => s + g.completionRate, 0) / games.length),
    }),
    [games],
  );

  // ─── HANDLERS ────────────────────────────────────────────
  const saveSettings = useCallback((gameId: string, settings: GameSettings) => {
    setGames((prev) =>
      prev.map((g) =>
        g.id === gameId
          ? { ...g, settings, lastUpdated: new Date().toISOString().split("T")[0] }
          : g,
      ),
    );
  }, []);

  const updateGameStatus = useCallback((gameId: string, status: GameStatus) => {
    setGames((prev) => prev.map((g) => (g.id === gameId ? { ...g, status } : g)));
  }, []);

  const openGame = useCallback((game: Game, mode: ViewMode = "overview") => {
    setSelectedGame(game);
    setViewMode(mode);
  }, []);

  const closeGame = useCallback(() => {
    setSelectedGame(null);
    setViewMode("overview");
  }, []);

  return {
    games,
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
  };
}
