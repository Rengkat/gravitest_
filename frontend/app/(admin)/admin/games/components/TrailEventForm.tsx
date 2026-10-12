import { Trash2 } from "lucide-react";
import { DiffRow } from "./DiffRow";
import { FormFooter } from "./FormFooter";
import { inputCls, Label } from "./Primitives";
import { AnyQuestion, Difficulty, Game, TrailEvent } from "../types";
import { useState } from "react";

// ─── 4. NIGERIAN TRAIL FORM ──────────────────────────────────
export function TrailEventForm({
  game,
  onAdd,
  onClose,
}: {
  game: Game;
  onAdd: (q: AnyQuestion) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(1960);
  const [month, setMonth] = useState(1);
  const [category, setCategory] = useState("Political Milestone");
  const [severity, setSeverity] = useState<"positive" | "negative" | "neutral">("neutral");
  const [text, setText] = useState("");
  const [choices, setChoices] = useState([
    { text: "", outcome: "", score: 100 },
    { text: "", outcome: "", score: -50 },
  ]);
  const [diff, setDiff] = useState<Difficulty>("medium");

  const CATEGORIES = [
    "Political Milestone",
    "Economic Event",
    "Military",
    "Social",
    "Cultural",
    "Natural Disaster",
    "International Relations",
  ];

  const submit = () => {
    if (!title.trim() || !text.trim()) return;
    onAdd({
      id: "",
      year,
      month,
      title,
      category,
      severity,
      zone: "nc",
      text,
      choices: choices.filter((c) => c.text.trim()),
      difficulty: diff,
    } as TrailEvent);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Event Title *</Label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Nigeria Achieves Independence"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Year *</Label>
          <input
            title="Event Year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            min={1960}
            max={2026}
            className={inputCls}
          />
        </div>
        <div>
          <Label>Month</Label>
          <select
            title="Event Month"
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className={inputCls}>
            {[
              "Jan",
              "Feb",
              "Mar",
              "Apr",
              "May",
              "Jun",
              "Jul",
              "Aug",
              "Sep",
              "Oct",
              "Nov",
              "Dec",
            ].map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Severity</Label>
          <select
            title="Event Severity"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as any)}
            className={inputCls}>
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <select
          title="Event Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputCls}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label>Event Narrative *</Label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the historical event in detail. Set the scene, give context, and explain the significance…"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Player Choices</Label>
          <button
            type="button"
            onClick={() => setChoices([...choices, { text: "", outcome: "", score: 0 }])}
            className="text-[11px] text-green-700 font-semibold">
            + Add Choice
          </button>
        </div>
        <div className="space-y-3">
          {choices.map((c, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2">
              <div className="flex gap-2 items-center">
                <span className="text-[11px] font-bold text-green-700 shrink-0">
                  Choice {i + 1}
                </span>
                <input
                  type="number"
                  value={c.score}
                  onChange={(e) => {
                    const n = [...choices];
                    n[i].score = parseInt(e.target.value);
                    setChoices(n);
                  }}
                  className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-[12px] text-center focus:outline-none"
                  placeholder="Points"
                />
                {choices.length > 1 && (
                  <button
                    title="remove choice"
                    type="button"
                    onClick={() => setChoices(choices.filter((_, j) => j !== i))}
                    className="ml-auto p-1 rounded hover:bg-red-50">
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                )}
              </div>
              <input
                value={c.text}
                onChange={(e) => {
                  const n = [...choices];
                  n[i].text = e.target.value;
                  setChoices(n);
                }}
                placeholder="Choice text shown to player"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <input
                value={c.outcome}
                onChange={(e) => {
                  const n = [...choices];
                  n[i].outcome = e.target.value;
                  setChoices(n);
                }}
                placeholder="Outcome narrative after player chooses this"
                className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-green-500/20 text-gray-600"
              />
            </div>
          ))}
        </div>
      </div>

      <DiffRow value={diff} onChange={setDiff} levels={game.settings.difficultyLevels} />
      <FormFooter onClose={onClose} onSubmit={submit} disabled={!title.trim() || !text.trim()} />
    </div>
  );
}
