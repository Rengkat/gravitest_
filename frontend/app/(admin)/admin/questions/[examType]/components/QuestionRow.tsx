"use client";

import { useState } from "react";
import { Eye, Pencil, Copy, Trash2, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import type { Question } from "@/types/questions";
import { TYPE_CONFIG, DIFFICULTY_CONFIG, CANDIDATE_TYPE_CONFIG } from "@/utils/config";
import { subjectLabel } from "@/lib/constants/subjects";

interface Props {
  question: Question;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onView: () => void;
  onEdit: () => void;
  onTogglePublish: () => Promise<void>;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
}

export function QuestionRow({
  question: q,
  isSelected,
  onToggleSelect,
  onView,
  onEdit,
  onTogglePublish,
  onDuplicate,
  onDelete,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const typeCfg = TYPE_CONFIG[q.type];
  const diffCfg = DIFFICULTY_CONFIG[q.difficulty];
  const TypeIcon = typeCfg.icon;

  async function run(action: string, fn: () => Promise<void>) {
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`p-4 rounded-2xl bg-white border flex items-start gap-3 hover:bg-cream/20 transition-colors ${
        isSelected ? "ring-2 ring-green-800/20" : ""
      }`}
      style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <input
        title="select"
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggleSelect(q.id)}
        className="w-4 h-4 rounded border-gray-300 text-green-800 mt-1.5 shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${typeCfg.bg} border ${typeCfg.border}`}
            style={{ color: typeCfg.color }}>
            <TypeIcon size={10} /> {typeCfg.label}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${diffCfg.bg} border ${diffCfg.border}`}
            style={{ color: diffCfg.color }}>
            {diffCfg.label}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              q.isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}>
            {q.isActive ? "Published" : "Draft"}
          </span>
          {q.candidateType && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {CANDIDATE_TYPE_CONFIG[q.candidateType].shortLabel} only
            </span>
          )}
          <span className="text-[11px] text-text-muted">
            {subjectLabel(q.subject)} · {q.year}
          </span>
        </div>
        <p className="text-[14px] text-green-900 leading-snug line-clamp-2">{q.questionText}</p>
        {q.topic && <p className="text-[11px] text-text-muted mt-1">Topic: {q.topic}</p>}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button title="view" onClick={onView} className="p-2 rounded-lg hover:bg-green-50 transition-colors">
          <Eye size={15} className="text-text-muted hover:text-green-600" />
        </button>
        <button title="edit" onClick={onEdit} className="p-2 rounded-lg hover:bg-blue-50 transition-colors">
          <Pencil size={15} className="text-text-muted hover:text-blue-600" />
        </button>
        <button
          title={q.isActive ? "unpublish" : "publish"}
          onClick={() => run("publish", onTogglePublish)}
          disabled={busy !== null}
          className="p-2 rounded-lg hover:bg-amber-50 transition-colors disabled:opacity-50">
          {busy === "publish" ? (
            <Loader2 size={15} className="animate-spin text-text-muted" />
          ) : q.isActive ? (
            <EyeOff size={15} className="text-text-muted hover:text-amber-600" />
          ) : (
            <CheckCircle size={15} className="text-text-muted hover:text-green-600" />
          )}
        </button>
        <button
          title="duplicate"
          onClick={() => run("duplicate", onDuplicate)}
          disabled={busy !== null}
          className="p-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50">
          {busy === "duplicate" ? (
            <Loader2 size={15} className="animate-spin text-text-muted" />
          ) : (
            <Copy size={15} className="text-text-muted hover:text-purple-600" />
          )}
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => run("delete", onDelete)}
              disabled={busy !== null}
              className="px-2 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 disabled:opacity-50">
              {busy === "delete" ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-semibold hover:bg-gray-200">
              Cancel
            </button>
          </div>
        ) : (
          <button
            title="delete"
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={15} className="text-text-muted hover:text-red-600" />
          </button>
        )}
      </div>
    </div>
  );
}
