"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, CheckCircle, X, Filter } from "lucide-react";
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
import { GAME_CONFIGS, DIFFICULTY_CONFIG, SCHOLAR_SUBJECTS, ALGEBRA_CLASSES } from "../constants";
import { Card, DifficultyChip, Label, inputCls } from "./Primitives";
import { AddQuestionModal } from "./AddQuestionModal";

interface Props {
  game: Game;
  onClose: () => void;
}

type AnyQ =
  | ScholarQuestion
  | AlgebraQuestion
  | KarmenLocation
  | TrailEvent
  | WordConnectPuzzle
  | ZombieLogicPuzzle;

function generateMockQuestions(game: Game): AnyQ[] {
  const count = Math.min(game.questionsCount, 25);

  if (game.slug === "scholar") {
    const subjects = SCHOLAR_SUBJECTS;
    return Array.from({ length: count }, (_, i) => ({
      id: `q_${i}`,
      subject: subjects[i % subjects.length],
      q: `Sample question ${i + 1} about ${subjects[i % subjects.length]}`,
      o: ["Option A", "Option B", "Option C", "Option D"] as [string, string, string, string],
      a: (i % 4) as 0 | 1 | 2 | 3,
      difficulty: (["easy", "medium", "hard"] as Difficulty[])[i % 3],
      explanation: "This is the correct answer because…",
      examRef: `WAEC ${2018 + (i % 6)}`,
      stats: { timesAnswered: 100 + i * 10, timesCorrect: 70 + i * 5, avgTime: 15 + i, skips: i },
    })) as ScholarQuestion[];
  }

  if (game.slug === "algebra-heist") {
    const classes = ALGEBRA_CLASSES;
    return Array.from({ length: count }, (_, i) => ({
      id: `q_${i}`,
      classLevel: classes[i % classes.length],
      roomLevel: ((i % 2) + 1) as 1 | 2,
      e: `${2 + i}x + ${i + 1} = ${(2 + i) * 3 + i + 1}`,
      c: [`${2 + i}x = ${(2 + i) * 3}`, `x = 3`],
      d: [`x = 4`, `x = 2`, `${2 + i}x = ${(2 + i) * 4}`],
      difficulty: (["easy", "medium", "hard", "expert"] as Difficulty[])[i % 4],
      stats: { timesAnswered: 80 + i * 8, timesCorrect: 55 + i * 4, avgTime: 20 + i, skips: i },
    })) as AlgebraQuestion[];
  }

  if (game.slug === "madam-karmen") {
    const states = ["Lagos", "Abuja", "Kano", "Rivers", "Oyo", "Enugu", "Kaduna"];
    return Array.from({ length: Math.min(count, states.length) }, (_, i) => ({
      id: `loc_${i}`,
      name: states[i],
      capital: `${states[i]} Capital`,
      zone: (["sw", "nc", "nw", "ss", "sw", "se", "nw"] as const)[i],
      slogan: `Slogan for ${states[i]}`,
      minerals: "Iron, Gold, Tin",
      notable: `Notable facts about ${states[i]}`,
      clueCulture: `Culture clue for ${states[i]}`,
      clueFood: `Food clue for ${states[i]}`,
      clueNature: `Nature clue for ${states[i]}`,
      clueLandmark: `Landmark clue for ${states[i]}`,
      artifact: "Mask",
      difficulty: (["easy", "medium", "hard"] as Difficulty[])[i % 3],
      stats: { timesAnswered: 200, timesCorrect: 150, avgTime: 25, skips: 5 },
    })) as KarmenLocation[];
  }

  if (game.slug === "nigerian-trail") {
    return Array.from({ length: count }, (_, i) => ({
      id: `ev_${i}`,
      year: 1960 + i * 3,
      month: 1 + (i % 12),
      title: `Historical Event ${i + 1}`,
      category: ["Political Milestone", "Economic Event", "Military", "Social"][i % 4],
      severity: (["positive", "negative", "neutral"] as const)[i % 3],
      zone: "nc",
      text: `This event occurred in ${1960 + i * 3} and had significant impact on Nigeria…`,
      choices: [
        { text: "Accept the terms", outcome: "The nation prospered.", score: 100 },
        { text: "Reject the terms", outcome: "Tensions rose significantly.", score: -50 },
      ],
      difficulty: (["easy", "medium", "hard"] as Difficulty[])[i % 3],
      stats: { timesAnswered: 90, timesCorrect: 60, avgTime: 30, skips: 10 },
    })) as TrailEvent[];
  }

  // word-connect + zombie-logic — generic
  return Array.from({ length: count }, (_, i) => ({
    id: `p_${i}`,
    name: `Puzzle ${i + 1}`,
    difficulty: (["easy", "medium", "hard"] as Difficulty[])[i % 3],
    stats: { timesAnswered: 120, timesCorrect: 85, avgTime: 40, skips: 8 },
  })) as AnyQ[];
}

export function QuestionsPanel({ game, onClose }: Props) {
  const cfg = GAME_CONFIGS[game.slug];
  const [questions, setQuestions] = useState<AnyQ[]>([]);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "all">("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    setQuestions(generateMockQuestions(game));
  }, [game]);

  const filtered = questions.filter((q) => {
    const text = JSON.stringify(q).toLowerCase();
    if (search && !text.includes(search.toLowerCase())) return false;
    if (diffFilter !== "all" && (q as any).difficulty !== diffFilter) return false;
    if (subjectFilter !== "all") {
      if ((q as any).subject !== subjectFilter && (q as any).classLevel !== subjectFilter)
        return false;
    }
    return true;
  });

  const handleAdd = (newQ: AnyQ) => {
    setQuestions((prev) => [{ ...newQ, id: `q_${Date.now()}` }, ...prev]);
  };

  const handleDelete = (id: string) => {
    setQuestions((prev) => prev.filter((q) => (q as any).id !== id));
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
          <h2 className="font-serif text-lg text-green-900">{cfg.questionLabel} Bank</h2>
          <p className="text-[12px] text-text-muted">
            {game.name} — {questions.length} {cfg.questionLabel.toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all">
            <Plus size={14} /> Add {cfg.questionLabel.slice(0, -1)}
          </button>
          <button
            title="close"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        className="px-6 py-4 border-b flex flex-wrap gap-3 items-center"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder={`Search ${cfg.questionLabel.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setDiffFilter("all")}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${diffFilter === "all" ? "bg-green-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All
          </button>
          {(["easy", "medium", "hard", "expert"] as Difficulty[])
            .filter((d) => game.settings.difficultyLevels.includes(d))
            .map((d) => (
              <DifficultyChip
                key={d}
                level={d}
                selected={diffFilter === d}
                onClick={() => setDiffFilter(d)}
              />
            ))}
        </div>

        {/* Subject/class filter */}
        {cfg.subjectBased && cfg.subjects && (
          <select
            title="filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-none">
            <option value="all">All {cfg.subjectBased ? "Subjects" : "Classes"}</option>
            {cfg.subjects.map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
        {cfg.classLevels && (
          <select
            title="filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-[13px] focus:outline-none">
            <option value="all">All Classes</option>
            {cfg.classLevels.map((c: string) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Question list */}
      <div className="flex-1 overflow-y-auto max-h-[55vh]">
        <div className="p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-text-muted text-[14px]">
              No {cfg.questionLabel.toLowerCase()} match your filters.
            </div>
          ) : (
            filtered.map((q) => (
              <QuestionRow
                key={(q as any).id}
                q={q}
                slug={game.slug}
                onDelete={() => handleDelete((q as any).id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <AddQuestionModal game={game} onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}
    </div>
  );
}

/** Renders the right row layout for each game type */
function QuestionRow({ q, slug, onDelete }: { q: AnyQ; slug: string; onDelete: () => void }) {
  const difficulty = (q as any).difficulty as Difficulty | undefined;
  const diffCfg = difficulty ? DIFFICULTY_CONFIG[difficulty] : null;

  return (
    <div
      className="p-4 rounded-xl border hover:shadow-sm transition-all group"
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Scholar question */}
          {slug === "scholar" &&
            (() => {
              const sq = q as ScholarQuestion;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {diffCfg && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: diffCfg.bg, color: diffCfg.color }}>
                        {difficulty}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-semibold">
                      {sq.subject}
                    </span>
                    {sq.examRef && (
                      <span className="text-[10px] text-text-muted">{sq.examRef}</span>
                    )}
                  </div>
                  <p className="text-[14px] font-medium text-gray-800 mb-2">{sq.q}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {sq.o.map((opt: string, idx: number) => (
                      <div
                        key={idx}
                        className={`text-[11px] p-1.5 rounded-lg flex items-center gap-1 ${idx === sq.a ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-600"}`}>
                        <span className="font-bold">{String.fromCharCode(65 + idx)}.</span> {opt}
                        {idx === sq.a && (
                          <CheckCircle size={10} className="ml-auto text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                  {sq.explanation && (
                    <p className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2">
                      <span className="font-semibold">Explanation:</span> {sq.explanation}
                    </p>
                  )}
                </>
              );
            })()}

          {/* Algebra question */}
          {slug === "algebra-heist" &&
            (() => {
              const aq = q as AlgebraQuestion;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    {diffCfg && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: diffCfg.bg, color: diffCfg.color }}>
                        {difficulty}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-semibold">
                      {aq.classLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[9px] font-semibold">
                      Room {aq.roomLevel}
                    </span>
                  </div>
                  <p className="text-[15px] font-mono font-bold text-gray-800 mb-2">{aq.e}</p>
                  <div className="flex gap-2 flex-wrap">
                    {aq.c.map((step: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-[11px] font-semibold border border-green-200">
                        {step}
                      </span>
                    ))}
                    {aq.d.map((d: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-lg bg-gray-50 text-gray-500 text-[11px]">
                        {d}
                      </span>
                    ))}
                  </div>
                </>
              );
            })()}

          {/* Madam Karmen location */}
          {slug === "madam-karmen" &&
            (() => {
              const loc = q as KarmenLocation;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    {diffCfg && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: diffCfg.bg, color: diffCfg.color }}>
                        {difficulty}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-semibold uppercase">
                      {loc.zone} zone
                    </span>
                  </div>
                  <h4 className="text-[15px] font-bold text-green-900 mb-1">{loc.name}</h4>
                  <p className="text-[12px] text-text-muted mb-2">
                    Capital: {loc.capital} · Slogan: {loc.slogan}
                  </p>
                  <div className="space-y-1">
                    <ClueRow label="Culture" text={loc.clueCulture} />
                    <ClueRow label="Food" text={loc.clueFood} />
                    <ClueRow label="Nature" text={loc.clueNature} />
                  </div>
                </>
              );
            })()}

          {/* Nigerian Trail event */}
          {slug === "nigerian-trail" &&
            (() => {
              const ev = q as TrailEvent;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    {diffCfg && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: diffCfg.bg, color: diffCfg.color }}>
                        {difficulty}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 text-[9px] font-semibold">
                      {ev.year}
                    </span>
                    <span className="text-[10px] text-text-muted">{ev.category}</span>
                  </div>
                  <h4 className="text-[14px] font-bold text-green-900 mb-1">{ev.title}</h4>
                  <p className="text-[12px] text-gray-600 line-clamp-2">{ev.text}</p>
                  {ev.choices && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {ev.choices.map((c: any, i: number) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-1 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                          {c.text} <span className="font-semibold text-green-700">+{c.score}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

          {/* Generic (word-connect, zombie-logic) */}
          {(slug === "word-connect" || slug === "zombie-logic") && (
            <>
              {diffCfg && (
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mb-2"
                  style={{ background: diffCfg.bg, color: diffCfg.color }}>
                  {difficulty}
                </span>
              )}
              <p className="text-[14px] font-medium text-gray-800">
                {(q as any).name ?? `Item ${(q as any).id}`}
              </p>
            </>
          )}

          {/* Stats footer */}
          {(q as any).stats && (
            <div
              className="mt-3 pt-2 border-t flex gap-4 text-[10px] text-text-muted"
              style={{ borderColor: "rgba(30,80,50,0.06)" }}>
              <span>Answered: {(q as any).stats.timesAnswered}</span>
              <span>
                Correct:{" "}
                {(
                  ((q as any).stats.timesCorrect / Math.max((q as any).stats.timesAnswered, 1)) *
                  100
                ).toFixed(0)}
                %
              </span>
              <span>Avg: {(q as any).stats.avgTime}s</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button title="edit" className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
            <Edit size={14} className="text-text-muted hover:text-blue-600" />
          </button>
          <button
            title="trash"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={14} className="text-text-muted hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ClueRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex gap-2 text-[11px]">
      <span className="text-green-700 font-semibold shrink-0 w-14">{label}:</span>
      <span className="text-gray-600 line-clamp-1">{text}</span>
    </div>
  );
}
