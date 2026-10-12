"use client";

import { useState } from "react";
import type { AnyQuestion, Difficulty, Game, ScholarQuestion } from "../types";
import { SCHOLAR_SUBJECTS } from "../constants";
import { Label, inputCls } from "./Primitives";
import { FormFooter } from "./FormFooter";
import { DiffRow } from "./DiffRow";

interface ScholarFormProps {
  game: Game;
  onAdd: (q: AnyQuestion) => void;
  onClose: () => void;
}

export function ScholarForm({ game, onAdd, onClose }: ScholarFormProps) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState<0 | 1 | 2 | 3>(0);
  const [subject, setSubject] = useState<(typeof SCHOLAR_SUBJECTS)[number]>("Mathematics");
  const [diff, setDiff] = useState<Difficulty>("medium");
  const [expl, setExpl] = useState("");
  const [examRef, setExamRef] = useState("");

  const submit = () => {
    if (!q.trim() || opts.some((o) => !o.trim())) return;
    onAdd({
      id: "",
      subject,
      q,
      o: opts as [string, string, string, string],
      a: correct,
      difficulty: diff,
      explanation: expl,
      examRef,
    } as ScholarQuestion);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Subject *</Label>
          <select
            title="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as any)}
            className={inputCls}>
            {SCHOLAR_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Exam Reference</Label>
          <input
            type="text"
            value={examRef}
            onChange={(e) => setExamRef(e.target.value)}
            placeholder="e.g. WAEC 2022"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <Label>Question Text *</Label>
        <textarea
          rows={3}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enter the question…"
          className={`${inputCls} resize-none`}
        />
      </div>

      <div>
        <Label>Answer Options * (click the letter to mark correct)</Label>
        <div className="space-y-2">
          {opts.map((opt, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${correct === i ? "border-green-500 bg-green-50/50" : "border-gray-200"}`}>
              <button
                type="button"
                onClick={() => setCorrect(i as 0 | 1 | 2 | 3)}
                className={`w-8 h-8 rounded-lg font-bold text-[13px] shrink-0 transition-all ${correct === i ? "bg-green-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {String.fromCharCode(65 + i)}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => {
                  const n = [...opts];
                  n[i] = e.target.value;
                  setOpts(n);
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-text-muted mt-1">
          Click the letter button to mark the correct answer
        </p>
      </div>

      <div>
        <Label>Explanation (optional)</Label>
        <textarea
          rows={2}
          value={expl}
          onChange={(e) => setExpl(e.target.value)}
          placeholder="Why is this the correct answer?"
          className={`${inputCls} resize-none`}
        />
      </div>

      <DiffRow value={diff} onChange={setDiff} levels={game.settings.difficultyLevels} />
      <FormFooter
        onClose={onClose}
        onSubmit={submit}
        disabled={!q.trim() || opts.some((o) => !o.trim())}
      />
    </div>
  );
}
