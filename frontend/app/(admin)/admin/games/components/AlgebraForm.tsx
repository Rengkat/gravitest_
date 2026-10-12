import { Trash2 } from "lucide-react";
import { DiffRow } from "./DiffRow";
import { FormFooter } from "./FormFooter";
import { inputCls, Label } from "./Primitives";
import { useState } from "react";
import { AlgebraQuestion, AnyQuestion, Difficulty, Game } from "../types";
import { ALGEBRA_CLASSES } from "../constants";

// ─── 2. ALGEBRA FORM ─────────────────────────────────────────
export function AlgebraForm({
  game,
  onAdd,
  onClose,
}: {
  game: Game;
  onAdd: (q: AnyQuestion) => void;
  onClose: () => void;
}) {
  const [classLevel, setClassLevel] = useState<(typeof ALGEBRA_CLASSES)[number]>("JSS1");
  const [roomLevel, setRoomLevel] = useState<1 | 2>(1);
  const [equation, setEquation] = useState("");
  const [steps, setSteps] = useState(["", ""]);
  const [distractors, setDistractors] = useState(["", ""]);
  const [diff, setDiff] = useState<Difficulty>("easy");

  const submit = () => {
    if (!equation.trim()) return;
    onAdd({
      id: "",
      classLevel,
      roomLevel,
      e: equation,
      c: steps.filter(Boolean),
      d: distractors.filter(Boolean),
      difficulty: diff,
    } as AlgebraQuestion);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Class Level *</Label>
          <select
            title="select class"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value as any)}
            className={inputCls}>
            {ALGEBRA_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Room (Difficulty Tier)</Label>
          <select
            title="set level"
            value={roomLevel}
            onChange={(e) => setRoomLevel(parseInt(e.target.value) as 1 | 2)}
            className={inputCls}>
            <option value={1}>Room 1 (Standard)</option>
            <option value={2}>Room 2 (Advanced)</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Equation *</Label>
        <input
          type="text"
          value={equation}
          onChange={(e) => setEquation(e.target.value)}
          placeholder="e.g. 3x + 5 = 20"
          className={`${inputCls} font-mono text-[15px]`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Correct Solution Steps</Label>
          <button
            type="button"
            onClick={() => setSteps([...steps, ""])}
            className="text-[11px] text-green-700 font-semibold hover:text-green-800">
            + Add Step
          </button>
        </div>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <span className="w-6 h-8 flex items-center justify-center text-[11px] font-bold text-green-700 shrink-0">
                {i + 1}.
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => {
                  const n = [...steps];
                  n[i] = e.target.value;
                  setSteps(n);
                }}
                placeholder={`Step ${i + 1}: e.g. 3x = 15`}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/20 font-mono"
              />
              {steps.length > 1 && (
                <button
                  title="remove step"
                  type="button"
                  onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                  className="p-1.5 rounded-lg hover:bg-red-50">
                  <Trash2 size={13} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Distractor Steps (wrong options)</Label>
          <button
            type="button"
            onClick={() => setDistractors([...distractors, ""])}
            className="text-[11px] text-green-700 font-semibold hover:text-green-800">
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {distractors.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={d}
                onChange={(e) => {
                  const n = [...distractors];
                  n[i] = e.target.value;
                  setDistractors(n);
                }}
                placeholder="e.g. x = 6 (wrong step)"
                className="flex-1 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50/30 text-[13px] focus:outline-none font-mono"
              />
              <button
                title="remove"
                type="button"
                onClick={() => setDistractors(distractors.filter((_, j) => j !== i))}
                className="p-1.5 rounded-lg hover:bg-red-50">
                <Trash2 size={13} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <DiffRow value={diff} onChange={setDiff} levels={game.settings.difficultyLevels} />
      <FormFooter onClose={onClose} onSubmit={submit} disabled={!equation.trim()} />
    </div>
  );
}
