"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type {
  Game,
  ScholarQuestion,
  AlgebraQuestion,
  KarmenLocation,
  TrailEvent,
  WordConnectPuzzle,
  ZombieLogicPuzzle,
  Difficulty,
} from "../types";
import { GAME_CONFIGS, SCHOLAR_SUBJECTS, ALGEBRA_CLASSES, NIGERIAN_ZONES } from "../constants";
import { Label, DifficultyChip, inputCls } from "./Primitives";
import { FormFooter } from "./FormFooter";
import { DiffRow } from "./DiffRow";
import { ScholarForm } from "./ScholarForm";
import { AlgebraForm } from "./AlgebraForm";
import { KarmenForm } from "./KarmenForm";
import { TrailEventForm } from "./TrailEventForm";
import { WordConnectForm } from "./WordConnectForm";
import { ZombieForm } from "./ZombieForm";

type AnyQ =
  | ScholarQuestion
  | AlgebraQuestion
  | KarmenLocation
  | TrailEvent
  | WordConnectPuzzle
  | ZombieLogicPuzzle;

interface Props {
  game: Game;
  onClose: () => void;
  onAdd: (q: AnyQ) => void;
}

export function AddQuestionModal({ game, onClose, onAdd }: Props) {
  const cfg = GAME_CONFIGS[game.slug];

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div
          className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div>
            <h2 className="font-serif text-lg text-green-900">
              Add {cfg.questionLabel.slice(0, -1)}
            </h2>
            <p className="text-[12px] text-text-muted">{game.name}</p>
          </div>
          <button title="close" onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {game.slug === "scholar" && <ScholarForm game={game} onAdd={onAdd} onClose={onClose} />}
          {game.slug === "algebra-heist" && (
            <AlgebraForm game={game} onAdd={onAdd} onClose={onClose} />
          )}
          {game.slug === "madam-karmen" && (
            <KarmenForm game={game} onAdd={onAdd} onClose={onClose} />
          )}
          {game.slug === "nigerian-trail" && (
            <TrailEventForm game={game} onAdd={onAdd} onClose={onClose} />
          )}
          {game.slug === "word-connect" && (
            <WordConnectForm game={game} onAdd={onAdd} onClose={onClose} />
          )}
          {game.slug === "zombie-logic" && (
            <ZombieForm game={game} onAdd={onAdd} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}
