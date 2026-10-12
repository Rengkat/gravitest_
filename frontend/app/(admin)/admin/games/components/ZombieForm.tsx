import { Trash2 } from "lucide-react";
import { DiffRow } from "./DiffRow";
import { FormFooter } from "./FormFooter";
import { inputCls, Label } from "./Primitives";
import { AnyQuestion, Difficulty, Game, ZombieLogicPuzzle } from "../types";
import { useState } from "react";

// ─── 6. ZOMBIE LOGIC FORM ────────────────────────────────────
export function ZombieForm({
  game,
  onAdd,
  onClose,
}: {
  game: Game;
  onAdd: (q: AnyQuestion) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState(1);
  const [traitCount, setTraitCount] = useState(3);
  const [clues, setClues] = useState(["", ""]);
  const [diff, setDiff] = useState<Difficulty>("medium");

  const submit = () => {
    if (!name.trim() || clues.every((c) => !c.trim())) return;
    onAdd({
      id: "",
      name,
      level,
      traitCount,
      clues: clues.filter(Boolean),
      solution: {},
      difficulty: diff,
    } as ZombieLogicPuzzle);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Puzzle Name *</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Masquerade Ball"
            className={inputCls}
          />
        </div>
        <div>
          <Label>Level Number</Label>
          <input
            title="level"
            type="number"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
            min={1}
            className={inputCls}
          />
        </div>
        <div>
          <Label>Number of Zombie Traits</Label>
          <select
            title="traits"
            value={traitCount}
            onChange={(e) => setTraitCount(parseInt(e.target.value))}
            className={inputCls}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} traits
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Logic Clues (constraints)</Label>
          <button
            type="button"
            onClick={() => setClues([...clues, ""])}
            className="text-[11px] text-green-700 font-semibold">
            + Add Clue
          </button>
        </div>
        <p className="text-[11px] text-text-muted mb-3">
          Each clue is a logical constraint the player uses to deduce zombie traits. E.g. "The
          zombie with the red mask does not have fire powers."
        </p>
        <div className="space-y-2">
          {clues.map((c, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-6 h-8 flex items-center justify-center text-[11px] font-bold text-red-500 shrink-0">
                {i + 1}.
              </span>
              <input
                value={c}
                onChange={(e) => {
                  const n = [...clues];
                  n[i] = e.target.value;
                  setClues(n);
                }}
                placeholder={`Constraint ${i + 1}…`}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              {clues.length > 2 && (
                <button
                  title="delete"
                  type="button"
                  onClick={() => setClues(clues.filter((_, j) => j !== i))}
                  className="p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <DiffRow value={diff} onChange={setDiff} levels={game.settings.difficultyLevels} />
      <FormFooter onClose={onClose} onSubmit={submit} disabled={!name.trim()} />
    </div>
  );
}
