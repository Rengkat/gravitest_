import { Trash2 } from "lucide-react";
import { DiffRow } from "./DiffRow";
import { FormFooter } from "./FormFooter";
import { inputCls, Label } from "./Primitives";
import { AnyQuestion, Difficulty, Game, WordConnectPuzzle } from "../types";
import { useState } from "react";

// ─── 5. WORD CONNECT FORM ─────────────────────────────────────
export function WordConnectForm({
  game,
  onAdd,
  onClose,
}: {
  game: Game;
  onAdd: (q: AnyQuestion) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("math");
  const [diff, setDiff] = useState<Difficulty>("medium");
  const [words, setWords] = useState([{ w: "", clue: "", dir: "h" as "h" | "v", r: 0, c: 0 }]);

  const submit = () => {
    if (!name.trim() || words.every((w) => !w.w.trim())) return;
    onAdd({
      id: "",
      subject,
      name,
      words: words.filter((w) => w.w.trim()),
      difficulty: diff,
      gridSize: 15,
    } as WordConnectPuzzle);
    onClose();
  };

  const SUBJECTS = {
    math: "Mathematics",
    science: "Science",
    english: "English",
    history: "History",
    geo: "Geography",
    tech: "Technology",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Puzzle Name *</Label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Algebra Terms"
            className={inputCls}
          />
        </div>
        <div>
          <Label>Subject</Label>
          <select
            title="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputCls}>
            {Object.entries(SUBJECTS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Words in Puzzle</Label>
          <button
            type="button"
            onClick={() => setWords([...words, { w: "", clue: "", dir: "h", r: 0, c: 0 }])}
            className="text-[11px] text-green-700 font-semibold">
            + Add Word
          </button>
        </div>
        <div className="space-y-3">
          {words.map((w, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
              <div className="flex gap-2">
                <input
                  value={w.w}
                  onChange={(e) => {
                    const n = [...words];
                    n[i].w = e.target.value.toUpperCase();
                    setWords(n);
                  }}
                  placeholder="WORD"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[14px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
                <select
                  title="word"
                  value={w.dir}
                  onChange={(e) => {
                    const n = [...words];
                    n[i].dir = e.target.value as "h" | "v";
                    setWords(n);
                  }}
                  className="px-2 py-1.5 rounded-lg border border-gray-200 text-[12px] focus:outline-none">
                  <option value="h">→ Horizontal</option>
                  <option value="v">↓ Vertical</option>
                </select>
                {words.length > 1 && (
                  <button
                    title="filter"
                    type="button"
                    onClick={() => setWords(words.filter((_, j) => j !== i))}
                    className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                )}
              </div>
              <input
                value={w.clue}
                onChange={(e) => {
                  const n = [...words];
                  n[i].clue = e.target.value;
                  setWords(n);
                }}
                placeholder="Clue / definition for this word"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          ))}
        </div>
      </div>

      <DiffRow value={diff} onChange={setDiff} levels={game.settings.difficultyLevels} />
      <FormFooter onClose={onClose} onSubmit={submit} disabled={!name.trim()} />
    </div>
  );
}
