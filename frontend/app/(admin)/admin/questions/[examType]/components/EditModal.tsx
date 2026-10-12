"use client";

import { useEffect, useState } from "react";
import { X, Loader2, AlertTriangle, BookOpen } from "lucide-react";
import type {
  Question,
  CandidateType,
  DifficultyLevel,
  QuestionType,
  Passage,
  EssayPart,
} from "@/types/questions";
import {
  TYPE_CONFIG,
  DIFFICULTY_CONFIG,
  MCQ_ONLY_EXAMS,
  CANDIDATE_TYPE_CONFIG,
  isCandidateTypeExam,
} from "@/utils/config";
import { ALL_SUBJECTS } from "@/lib/constants/subjects";
import * as questionsApi from "@/lib/api/questions";
import * as passagesApi from "@/lib/api/passages";
import { extractErrorMessage } from "@/lib/api/client";
import PassagePanel from "@/app/(protected)/components/PassagePanel";
import ImageUploadField, { type ImageUploadValue } from "@/Components/ImageUploadField";
import EssayStructureEditor from "@/Components/EssayStructureEditor";

const MCQ_LIKE: QuestionType[] = ["mcq", "true_false", "objective"];

interface Props {
  question: Question;
  onClose: () => void;
  onSaved: (updated: Question) => void;
}

export function EditModal({ question, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    questionText: question.questionText,
    candidateType: (question.candidateType ?? "") as CandidateType | "",
    subject: question.subject,
    year: question.year,
    topic: question.topic ?? "",
    difficulty: question.difficulty,
    type: question.type,
    maxScore: question.maxScore ?? 1,
    modelAnswer: question.modelAnswer ?? "",
    options: question.options?.length
      ? question.options.map((o) => ({ label: o.label, text: o.text, order: o.order }))
      : (["A", "B", "C", "D"] as const).map((l, i) => ({ label: l, text: "", order: i })),
    correctLabel: question.answer?.correctLabel ?? "A",
    explanationText: question.explanations?.[0]?.text ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direct-upload images — pre-seeded from whatever's already saved on
  // the question, same convention as the create page.
  const [questionImage, setQuestionImage] = useState<ImageUploadValue | null>(
    question.questionImageUrl ? { url: question.questionImageUrl } : null,
  );
  const [optionImages, setOptionImages] = useState<(ImageUploadValue | null)[]>(
    (["A", "B", "C", "D"] as const).map((l) => {
      const existing = question.options?.find((o) => o.label === l);
      return existing?.imageUrl ? { url: existing.imageUrl } : null;
    }),
  );
  const [explanationImage, setExplanationImage] = useState<ImageUploadValue | null>(
    question.explanations?.[0]?.imageUrl ? { url: question.explanations[0].imageUrl! } : null,
  );
  const [essayStructure, setEssayStructure] = useState<EssayPart[]>(question.structure ?? []);

  // ── Passage — same three modes as the create page. Starts on
  // "existing" (pre-selected) if the question already has one, so
  // editing doesn't accidentally detach it.
  const [passageMode, setPassageMode] = useState<"none" | "existing" | "new">(
    question.passageId ? "existing" : "none",
  );
  const [existingPassages, setExistingPassages] = useState<Passage[]>(
    question.passage ? [question.passage] : [],
  );
  const [loadingPassages, setLoadingPassages] = useState(false);
  const [selectedPassageId, setSelectedPassageId] = useState(question.passageId ?? "");
  const [newPassage, setNewPassage] = useState({ title: "", instructions: "", passageText: "" });
  const [newPassageImage, setNewPassageImage] = useState<ImageUploadValue | null>(null);

  const selectedPassage = existingPassages.find((p) => p.id === selectedPassageId) ?? null;

  useEffect(() => {
    if (passageMode !== "existing") return;
    let cancelled = false;
    setLoadingPassages(true);
    passagesApi
      .listPassages({
        examType: question.examType,
        subject: form.subject,
        year: form.year,
        limit: 50,
      })
      .then((res) => {
        if (!cancelled) {
          // Keep the question's current passage in the list even if it
          // falls outside this page of results, so it doesn't vanish
          // from the dropdown while still selected.
          const merged =
            question.passage && !res.data.some((p) => p.id === question.passage!.id)
              ? [question.passage, ...res.data]
              : res.data;
          setExistingPassages(merged);
        }
      })
      .catch(() => {
        if (!cancelled) setExistingPassages(question.passage ? [question.passage] : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingPassages(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageMode, form.subject, form.year]);

  const isMcqLike = MCQ_LIKE.includes(form.type);
  const isPassageValid =
    passageMode !== "new" || !!(newPassage.passageText.trim() || newPassageImage);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  function updateOption(idx: number, text: string) {
    const next = [...form.options];
    next[idx] = { ...next[idx], text };
    set("options", next);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      let passageId: string | null | undefined;
      if (passageMode === "none") {
        passageId = null;
      } else if (passageMode === "existing") {
        passageId = selectedPassageId || null;
      } else {
        const passage = await passagesApi.createPassage({
          examType: question.examType,
          subject: form.subject,
          year: form.year,
          title: newPassage.title || undefined,
          instructions: newPassage.instructions || undefined,
          passageText: newPassage.passageText || undefined,
          passageImageUrl: newPassageImage?.url || undefined,
          isActive: true,
        });
        passageId = passage.id;
      }

      const payload: questionsApi.UpdateQuestionPayload = {
        questionText: form.questionText,
        questionImageUrl: questionImage?.url || null,
        candidateType: isCandidateTypeExam(question.examType) ? form.candidateType || null : null,
        subject: form.subject as any,
        year: form.year,
        topic: form.topic || null,
        difficulty: form.difficulty,
        type: form.type,
        passageId,
      };
      if (isMcqLike) {
        payload.options = form.options.map((o, idx) => ({
          label: o.label as "A" | "B" | "C" | "D",
          text: o.text,
          imageUrl: optionImages[idx]?.url || null,
          order: o.order,
        }));
        payload.answer = { correctLabel: form.correctLabel };
      } else {
        payload.maxScore = form.maxScore;
        payload.modelAnswer = form.modelAnswer || undefined;
        if (form.type === "theory") {
          payload.structure = essayStructure.length > 0 ? essayStructure : null;
        }
      }
      if (form.explanationText) {
        payload.explanations = [
          { text: form.explanationText, imageUrl: explanationImage?.url || null },
        ];
      }

      const updated = await questionsApi.updateQuestion(question.id, payload);
      onSaved(updated);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full px-3 py-2.5 rounded-xl border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-xl text-green-900">Edit Question</h3>
          <button
            title="close"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 font-medium flex items-start gap-2">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
              Question Text
            </label>
            <textarea
              rows={4}
              value={form.questionText}
              onChange={(e) => set("questionText", e.target.value)}
              className={inputCls}
            />
          </div>

          <ImageUploadField
            label="Question Image (optional)"
            value={questionImage}
            onChange={setQuestionImage}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
                Subject
              </label>
              <select
                title="subject"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                className={inputCls}>
                {ALL_SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Year</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => set("year", parseInt(e.target.value, 10) || form.year)}
                className={inputCls}
              />
            </div>
          </div>

          {isCandidateTypeExam(question.examType) && (
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
                Candidate Type
              </label>
              <select
                title="candidate type"
                value={form.candidateType}
                onChange={(e) => set("candidateType", e.target.value as CandidateType | "")}
                className={inputCls}>
                <option value="">Both (School &amp; Private)</option>
                {(Object.keys(CANDIDATE_TYPE_CONFIG) as CandidateType[]).map((ct) => (
                  <option key={ct} value={ct}>
                    {CANDIDATE_TYPE_CONFIG[ct].label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
                Difficulty
              </label>
              <select
                title="difficulty"
                value={form.difficulty}
                onChange={(e) => set("difficulty", e.target.value as DifficultyLevel)}
                className={inputCls}>
                {Object.entries(DIFFICULTY_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Type</label>
              <select
                title="type"
                value={form.type}
                onChange={(e) => set("type", e.target.value as QuestionType)}
                className={inputCls}>
                {Object.entries(TYPE_CONFIG).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-1.5">Topic</label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => set("topic", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Passage / comprehension (optional) */}
          <div
            className="rounded-xl border border-dashed p-4"
            style={{ borderColor: "rgba(30,80,50,0.2)" }}>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-amber-700" />
              <span className="text-[12px] font-bold text-green-900 uppercase tracking-wide">
                Passage (optional)
              </span>
            </div>
            <div className="flex gap-2 mb-3">
              {(["none", "existing", "new"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPassageMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    passageMode === m
                      ? "bg-green-800 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {m === "none"
                    ? "No passage"
                    : m === "existing"
                      ? "Attach existing"
                      : "Write new passage"}
                </button>
              ))}
            </div>

            {passageMode === "existing" && (
              <div>
                {loadingPassages ? (
                  <p className="text-[12px] text-text-muted flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Loading passages…
                  </p>
                ) : existingPassages.length === 0 ? (
                  <p className="text-[12px] text-text-muted">
                    No passages found for this subject/year yet — switch to &quot;Write new
                    passage&quot;.
                  </p>
                ) : (
                  <select
                    title="passage"
                    value={selectedPassageId}
                    onChange={(e) => setSelectedPassageId(e.target.value)}
                    className={inputCls}>
                    <option value="">Select a passage…</option>
                    {existingPassages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title || "Untitled passage"} — {(p.passageText ?? "").slice(0, 60)}
                        {(p.passageText?.length ?? 0) > 60 ? "…" : ""}
                      </option>
                    ))}
                  </select>
                )}
                {selectedPassage && (
                  <div className="mt-3 rounded-lg overflow-hidden">
                    <PassagePanel passage={selectedPassage} />
                  </div>
                )}
              </div>
            )}

            {passageMode === "new" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newPassage.title}
                  onChange={(e) => setNewPassage((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Passage title (optional)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newPassage.instructions}
                  onChange={(e) => setNewPassage((p) => ({ ...p, instructions: e.target.value }))}
                  placeholder="Instructions shown above the passage (optional)"
                  className={inputCls}
                />
                <textarea
                  rows={5}
                  value={newPassage.passageText}
                  onChange={(e) => setNewPassage((p) => ({ ...p, passageText: e.target.value }))}
                  placeholder="Paste or write the passage / case study / scenario text…"
                  className={inputCls}
                />
                <ImageUploadField
                  label="Passage image/diagram (optional)"
                  value={newPassageImage}
                  onChange={setNewPassageImage}
                />
                {(newPassage.passageText || newPassageImage) && (
                  <div className="rounded-lg overflow-hidden">
                    <PassagePanel
                      passage={{
                        title: newPassage.title,
                        instructions: newPassage.instructions,
                        passageText: newPassage.passageText,
                        passageImageUrl: newPassageImage?.url ?? null,
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {isMcqLike ? (
            <div>
              <label className="block text-[12px] font-semibold text-green-900 mb-2">
                Options — select the correct one
              </label>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={opt.label} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set("correctLabel", opt.label)}
                      className={`w-8 h-8 rounded-lg font-bold text-[12px] shrink-0 transition-all ${
                        form.correctLabel === opt.label
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {opt.label}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Option ${opt.label}`}
                      className={inputCls}
                    />
                    <div className="shrink-0">
                      <ImageUploadField
                        label=""
                        compact
                        value={optionImages[idx]}
                        onChange={(v) =>
                          setOptionImages((prev) => prev.map((p, i) => (i === idx ? v : p)))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
                  Max Score
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxScore}
                  onChange={(e) => set("maxScore", parseInt(e.target.value, 10) || 1)}
                  className={inputCls}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
                  Model Answer / Mark Scheme
                </label>
                <textarea
                  rows={2}
                  value={form.modelAnswer}
                  onChange={(e) => set("modelAnswer", e.target.value)}
                  className={inputCls}
                />
              </div>
              {form.type === "theory" && (
                <div className="col-span-3">
                  <EssayStructureEditor parts={essayStructure} onChange={setEssayStructure} />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
              Explanation (optional)
            </label>
            <textarea
              rows={2}
              value={form.explanationText}
              onChange={(e) => set("explanationText", e.target.value)}
              className={inputCls}
            />
            {form.explanationText && (
              <div className="mt-2 max-w-[8rem]">
                <ImageUploadField
                  label="Explanation image"
                  compact
                  value={explanationImage}
                  onChange={setExplanationImage}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-[14px] font-semibold text-text-muted hover:bg-gray-50 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isPassageValid}
            className="flex-1 py-3 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-[14px] disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
