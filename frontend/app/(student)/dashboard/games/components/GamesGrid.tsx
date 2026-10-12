"use client";

import { Game } from "@/types/games";
import GameCard from "./GameCard";
import { Gamepad2 } from "lucide-react";

interface GamesGridProps {
  games: Game[];
  onReset: () => void;
}

export default function GamesGrid({ games, onReset }: GamesGridProps) {
  if (games.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-900/50 border border-gray-800 rounded-2xl">
        <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <Gamepad2 size={32} className="text-gray-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-300 mb-2">No games found</h3>
        <p className="text-gray-500 mb-5">Try adjusting your filters or search query</p>
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
          Reset Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </div>
  );
}
