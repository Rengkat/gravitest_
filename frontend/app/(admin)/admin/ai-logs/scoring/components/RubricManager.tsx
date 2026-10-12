"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  CheckCircle2,
  BookOpen,
  Loader2,
} from "lucide-react";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { AiRubric, RubricCriterion } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 text-green-900";

export function RubricManager() {
  const [rubrics, setRubrics] = useState<AiRubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newRubric, setNewRubric] = useState<{
    name: string;
    subject: string;
    examType: string;
    description: string;
    criteria: RubricCriterion[];
  }>({ name: "", subject: "", examType: "", description: "", criteria: [] });
  const [draftCriterion, setDraftCriterion] = useState({ criterion: "", maxPoints: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await aiAdminApi.listRubrics();
      setRubrics(list);
      setExpandedId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await aiAdminApi.deleteRubric(id);
      setRubrics((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleActive = async (rubric: AiRubric) => {
    setBusyId(rubric.id);
    try {
      const updated = await aiAdminApi.updateRubric(rubric.id, { isActive: !rubric.isActive });
      setRubrics((prev) => prev.map((r) => (r.id === rubric.id ? updated : r)));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const addDraftCriterion = () => {
    const points = parseInt(draftCriterion.maxPoints);
    if (!draftCriterion.criterion.trim() || !points || points <= 0) return;
    setNewRubric((n) => ({
      ...n,
      criteria: [...n.criteria, { criterion: draftCriterion.criterion, maxPoints: points }],
    }));
    setDraftCriterion({ criterion: "", maxPoints: "" });
  };

  const removeDraftCriterion = (i: number) => {
    setNewRubric((n) => ({ ...n, criteria: n.criteria.filter((_, idx) => idx !== i) }));
  };

  const handleCreate = async () => {
    if (!newRubric.name.trim() || newRubric.criteria.length === 0) return;
    setCreating(true);
    setError(null);
    try {
      const created = await aiAdminApi.createRubric({
        name: newRubric.name,
        subject: newRubric.subject || undefined,
        examType: newRubric.examType || undefined,
        description: newRubric.description || undefined,
        criteria: newRubric.criteria,
      });
      setRubrics((prev) => [created, ...prev]);
      setShowNew(false);
      setNewRubric({ name: "", subject: "", examType: "", description: "", criteria: [] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-lg text-green-900">Grading Rubrics</h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            {rubrics.filter((r) => r.isActive).length} active rubric
            {rubrics.filter((r) => r.isActive).length !== 1 ? "s" : ""} the AI grader can apply
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all">
          <Plus size={14} /> New Rubric
        </button>
      </div>

      {rubrics.length === 0 && !showNew && (
        <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <p className="text-[13px] text-text-muted">
            No rubrics yet. Create one to give the AI grader per-criterion scoring instructions.
          </p>
        </div>
      )}

      {rubrics.map((rubric) => {
        const isExpanded = expandedId === rubric.id;
        const totalPoints = rubric.criteria.reduce((s, c) => s + c.maxPoints, 0);
        const isBusy = busyId === rubric.id;
        return (
          <div
            key={rubric.id}
            className="bg-white rounded-2xl border overflow-hidden"
            style={{ borderColor: "rgba(30,80,50,0.08)" }}>
            <div
              className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-cream/20"
              onClick={() => toggleExpand(rubric.id)}>
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <BookOpen size={16} className="text-green-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-semibold text-green-900">{rubric.name}</span>
                  {rubric.examType && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700">
                      {rubric.examType}
                    </span>
                  )}
                  {rubric.subject && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700">
                      {rubric.subject}
                    </span>
                  )}
                  {!rubric.isActive && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </div>
                {rubric.description && (
                  <p className="text-[11px] text-text-muted mt-0.5 truncate">{rubric.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-green-900">{totalPoints} pts</span>
                {isExpanded ? (
                  <ChevronUp size={15} className="text-text-muted" />
                ) : (
                  <ChevronDown size={15} className="text-text-muted" />
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t px-5 py-4 space-y-4" style={{ borderColor: "rgba(30,80,50,0.06)" }}>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
                    Criteria
                  </h4>
                  <div className="space-y-2">
                    {rubric.criteria.map((c, i) => (
                      <div key={i} className="p-3 rounded-xl bg-cream border border-gray-100">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={13} className="text-green-600 shrink-0 mt-0.5" />
                            <span className="text-[13px] font-semibold text-green-900">{c.criterion}</span>
                          </div>
                          <span className="text-[12px] font-bold text-green-900 shrink-0">
                            {c.maxPoints} pts
                          </span>
                        </div>
                        {c.description && <p className="text-[11px] text-text-muted ml-5">{c.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t"
                  style={{ borderColor: "rgba(30,80,50,0.06)" }}>
                  <p className="text-[10px] text-text-muted">
                    Updated {new Date(rubric.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(rubric)}
                      disabled={isBusy}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all disabled:opacity-50 ${
                        rubric.isActive
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                      }`}>
                      {isBusy ? <Loader2 size={11} className="animate-spin" /> : null}
                      {rubric.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(rubric.id)}
                      disabled={isBusy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-100 bg-red-50 text-red-600 text-[12px] hover:bg-red-100 transition-all disabled:opacity-50">
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {showNew && (
        <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg text-green-900">New Rubric</h3>
            <button
              title="Close"
              onClick={() => setShowNew(false)}
              className="p-1.5 rounded-lg hover:bg-cream text-text-muted">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                Rubric Name *
              </label>
              <input
                type="text"
                className={inputCls}
                value={newRubric.name}
                onChange={(e) => setNewRubric((n) => ({ ...n, name: e.target.value }))}
                placeholder="e.g., NECO Chemistry Rubric"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                Subject
              </label>
              <input
                type="text"
                className={inputCls}
                value={newRubric.subject}
                onChange={(e) => setNewRubric((n) => ({ ...n, subject: e.target.value }))}
                placeholder="e.g., Chemistry"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
                Exam Type
              </label>
              <input
                type="text"
                className={inputCls}
                value={newRubric.examType}
                onChange={(e) => setNewRubric((n) => ({ ...n, examType: e.target.value }))}
                placeholder="e.g., NECO"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Description
            </label>
            <textarea
              title="Optional description of the rubric"
              placeholder="Optional description of the rubric"
              className={`${inputCls} resize-none`}
              rows={2}
              value={newRubric.description}
              onChange={(e) => setNewRubric((n) => ({ ...n, description: e.target.value }))}
            />
          </div>

          {/* Criteria builder — required, at least one */}
          <div className="mb-4">
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
              Criteria *
            </label>
            {newRubric.criteria.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {newRubric.criteria.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cream text-[12px]">
                    <span>
                      {c.criterion} — <span className="font-semibold">{c.maxPoints} pts</span>
                    </span>
                    <button onClick={() => removeDraftCriterion(i)} className="text-red-500 hover:text-red-600">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                className={inputCls}
                placeholder="Criterion e.g. Content & Ideas"
                value={draftCriterion.criterion}
                onChange={(e) => setDraftCriterion((d) => ({ ...d, criterion: e.target.value }))}
              />
              <input
                type="number"
                min={1}
                className={`${inputCls} w-24 shrink-0`}
                placeholder="Points"
                value={draftCriterion.maxPoints}
                onChange={(e) => setDraftCriterion((d) => ({ ...d, maxPoints: e.target.value }))}
              />
              <button
                onClick={addDraftCriterion}
                className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] hover:bg-cream shrink-0">
                Add
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={creating || !newRubric.name.trim() || newRubric.criteria.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all disabled:opacity-50">
              {creating ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Create Rubric
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-[13px] hover:bg-cream transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
