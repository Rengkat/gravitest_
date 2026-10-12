"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import type { Game, GameSettings, GameStatus } from "../types";
import { STATUS_CONFIG } from "../constants";
import { Toggle, Label, DifficultyChip, inputCls, SectionTitle } from "./Primitives";

interface Props {
  game: Game;
  onSave: (id: string, settings: GameSettings) => void;
  onStatusChange: (id: string, status: GameStatus) => void;
  onClose: () => void;
}

export function GameSettingsPanel({ game, onSave, onStatusChange, onClose }: Props) {
  const [s, setS] = useState<GameSettings>({ ...game.settings });
  const [dirty, setDirty] = useState(false);

  const upd = (patch: Partial<GameSettings>) => {
    setS((p) => ({ ...p, ...patch }));
    setDirty(true);
  };
  const updScoring = (patch: Partial<GameSettings["scoring"]>) =>
    upd({ scoring: { ...s.scoring, ...patch } });

  const toggleDifficulty = (level: string) => {
    const cur = s.difficultyLevels;
    if (cur.includes(level as any)) {
      if (cur.length === 1) return; // keep at least one
      upd({ difficultyLevels: cur.filter((l) => l !== level) as any });
    } else {
      upd({ difficultyLevels: [...cur, level as any] });
    }
    setDirty(true);
  };

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div>
          <h2 className="font-serif text-lg text-green-900">Game Settings</h2>
          <p className="text-[12px] text-text-muted">{game.name}</p>
        </div>
        <button
          title="close"
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Game Status */}
        <div>
          <SectionTitle>Game Status</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {(["active", "beta", "maintenance", "disabled"] as GameStatus[]).map((status) => {
              const cfg = STATUS_CONFIG[status];
              const active = game.status === status;
              return (
                <button
                  key={status}
                  onClick={() => onStatusChange(game.id, status)}
                  className="px-4 py-2 rounded-xl text-[12px] font-semibold capitalize transition-all border-2"
                  style={
                    active
                      ? { background: cfg.color, color: "#fff", borderColor: cfg.color }
                      : { background: cfg.bg, color: cfg.color, borderColor: "transparent" }
                  }>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Difficulty levels */}
        <div>
          <SectionTitle>Available Difficulty Levels</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {["easy", "medium", "hard", "expert"].map((level) => (
              <DifficultyChip
                key={level}
                level={level}
                selected={s.difficultyLevels.includes(level as any)}
                onClick={() => toggleDifficulty(level)}
              />
            ))}
          </div>
        </div>

        {/* Numeric settings */}
        <div>
          <SectionTitle>Game Mechanics</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Time Limit (s)</Label>
              <input
                title="limit"
                type="number"
                value={s.timeLimit}
                onChange={(e) => upd({ timeLimit: parseInt(e.target.value) || 0 })}
                className={inputCls}
                min={0}
              />
              <p className="text-[10px] text-text-muted mt-1">0 = unlimited</p>
            </div>
            <div>
              <Label>Lives</Label>
              <input
                title="lives"
                type="number"
                value={s.lives}
                onChange={(e) => upd({ lives: parseInt(e.target.value) || 1 })}
                className={inputCls}
                min={1}
                max={10}
              />
            </div>
            <div>
              <Label>Max Questions</Label>
              <input
                title="questions"
                type="number"
                value={s.maxQuestions}
                onChange={(e) => upd({ maxQuestions: parseInt(e.target.value) || 1 })}
                className={inputCls}
                min={1}
              />
            </div>
            <div>
              <Label>Base Points</Label>
              <input
                title="points"
                type="number"
                value={s.scoring.basePoints}
                onChange={(e) => updScoring({ basePoints: parseInt(e.target.value) || 0 })}
                className={inputCls}
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Scoring toggles */}
        <div>
          <SectionTitle>Scoring & Bonuses</SectionTitle>
          <div className="space-y-3">
            <ToggleRow
              label="Time Bonus"
              desc="Extra points for fast answers"
              checked={s.scoring.timeBonus}
              onChange={() => updScoring({ timeBonus: !s.scoring.timeBonus })}
            />
            <ToggleRow
              label="Streak Bonus"
              desc="Multiplier for consecutive correct answers"
              checked={s.scoring.streakBonus}
              onChange={() => updScoring({ streakBonus: !s.scoring.streakBonus })}
            />
            {s.scoring.streakBonus && (
              <div className="ml-6 mt-2">
                <Label>Streak Multiplier</Label>
                <input
                  title="streak multiplier"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={s.scoring.streakMultiplier}
                  onChange={(e) =>
                    updScoring({ streakMultiplier: parseFloat(e.target.value) || 1 })
                  }
                  className={`${inputCls} max-w-[120px]`}
                />
              </div>
            )}
          </div>
        </div>

        {/* Feature toggles */}
        <div>
          <SectionTitle>Features</SectionTitle>
          <div className="space-y-3">
            <ToggleRow
              label="Hints Enabled"
              desc="Allow players to use hints during gameplay"
              checked={s.hintsEnabled}
              onChange={() => upd({ hintsEnabled: !s.hintsEnabled })}
            />
            <ToggleRow
              label="Leaderboard"
              desc="Show rankings and top scores publicly"
              checked={s.leaderboardEnabled}
              onChange={() => upd({ leaderboardEnabled: !s.leaderboardEnabled })}
            />
            <ToggleRow
              label="Daily Challenges"
              desc="Generate a fresh challenge every 24 hours"
              checked={s.dailyChallenges}
              onChange={() => upd({ dailyChallenges: !s.dailyChallenges })}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex gap-3 px-6 py-4 border-t justify-end"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-[13px] font-semibold text-text-muted hover:bg-gray-50 transition-all">
          Cancel
        </button>
        <button
          onClick={() => {
            onSave(game.id, s);
            setDirty(false);
          }}
          disabled={!dirty}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all disabled:opacity-50">
          <Save size={14} /> Save Changes
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors">
      <div>
        <div className="text-[13px] font-semibold text-green-900">{label}</div>
        <div className="text-[11px] text-text-muted">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
