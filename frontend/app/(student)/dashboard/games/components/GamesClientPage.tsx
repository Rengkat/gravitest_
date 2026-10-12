"use client";

import { useState, useMemo } from "react";
import { GAMES } from "@/lib/constants/games";
import GamesHero from "./GamesHero";
import GamesFilter from "./GamesFilter";
import GamesGrid from "./GamesGrid";
import FeaturedGameBanner from "./FeaturedGameBanner";
import Leaderboard from "./Leaderboard";
import DailyChallenge from "./DailyChallenge";
import RecentlyPlayed from "./RecentlyPlayed";

export default function GamesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const filteredGames = useMemo(() => {
    return GAMES.filter((game) => {
      if (selectedCategory !== "All" && game.category !== selectedCategory) return false;
      if (selectedDifficulty !== "All" && game.difficulty !== selectedDifficulty) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !game.title.toLowerCase().includes(q) &&
          !game.description.toLowerCase().includes(q) &&
          !game.tags.some((t) => t.toLowerCase().includes(q))
        )
          return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedDifficulty]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDifficulty("All");
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <GamesHero />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Daily challenge */}
        <DailyChallenge />

        {/* Recently played */}
        <RecentlyPlayed />

        {/* Filters */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[20px] font-black text-white">All Games</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">
                {filteredGames.length} game{filteredGames.length !== 1 ? "s" : ""} available
              </p>
            </div>
          </div>
          <GamesFilter
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            selectedDifficulty={selectedDifficulty}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onDifficultyChange={setSelectedDifficulty}
          />

          {/* Grid */}
          <GamesGrid games={filteredGames} onReset={resetFilters} />
        </div>

        {/* Featured banner */}
        <FeaturedGameBanner />

        {/* Leaderboard */}
        <Leaderboard />

        {/* Bottom spacing */}
        <div className="h-12" />
      </div>
    </div>
  );
}
