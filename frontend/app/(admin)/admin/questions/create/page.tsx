"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, BookOpen } from "lucide-react";
import type {
  ExamType,
  CandidateType,
  QuestionType,
  DifficultyLevel,
  Passage,
  EssayPart,
} from "@/types/questions";
import {
  EXAM_LABELS,
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

// This used to be a 4-tab wizard (Basic Info / Content / Media / Advanced)
// modeling parts, subparts, hints, diagrams, links, and nested
// sub-questions — none of which the backend's CreateQuestionDto
// supports (it's examType/subject/year/questionText/difficulty/type/
// topic/maxScore + options+answer for MCQ-like types, or
// maxScore+modelAnswer for open-ended types, + optional explanations).
// Rebuilt as one page that collects exactly what the real API accepts
// and actually saves it.
const MCQ_LIKE: QuestionType[] = ["mcq", "true_false", "objective"];

function CreateQuestionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetExamType = (searchParams.get("examType") as ExamType) ?? "";

  const [form, setForm] = useState({
    examType: presetExamType,
    // Only meaningful when isCandidateTypeExam(examType) is true (WAEC,
    // NECO, NABTEB, BECE, Junior NECO). "" = applies to both streams.
    candidateType: "" as CandidateType | "",
    subject: "",
    year: new Date().getFullYear(),
    topic: "",
    difficulty: "medium" as DifficultyLevel,
    type: (presetExamType && MCQ_ONLY_EXAMS.has(presetExamType) ? "mcq" : "mcq") as QuestionType,
    questionText: "",
    maxScore: 1,
    modelAnswer: "",
    options: (["A", "B", "C", "D"] as const).map((l, i) => ({ label: l, text: "", order: i })),
    correctLabel: "A" as "A" | "B" | "C" | "D",
    explanationText: "",
    isActive: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ── Passage (comprehension / case-study / shared stem) ───────────────
  // "none": standalone question (the common case).
  // "existing": attach to a passage another question in this set already
  //   created — lets an admin build a comprehension set one question at
  //   a time instead of only via bulk import.
  // "new": write a passage here; it's created via POST /passages right
  //   before the question, then linked by the returned id.
  const [passageMode, setPassageMode] = useState<"none" | "existing" | "new">("none");
  const [existingPassages, setExistingPassages] = useState<Passage[]>([]);
  const [loadingPassages, setLoadingPassages] = useState(false);
  const [selectedPassageId, setSelectedPassageId] = useState("");
  const [newPassage, setNewPassage] = useState({
    title: "",
    instructions: "",
    passageText: "",
  });
  const [newPassageImage, setNewPassageImage] = useState<ImageUploadValue | null>(null);

  // Direct-upload images (question / per-option / explanation). Kept as
  // separate ImageUploadValue state, synced into the payload on submit —
  // the underlying fields (questionImageUrl, options[i].imageUrl,
  // explanations[0].imageUrl) are still plain URL strings as far as the
  // API is concerned.
  const [questionImage, setQuestionImage] = useState<ImageUploadValue | null>(null);
  const [optionImages, setOptionImages] = useState<(ImageUploadValue | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [explanationImage, setExplanationImage] = useState<ImageUploadValue | null>(null);
  const [essayStructure, setEssayStructure] = useState<EssayPart[]>([]);

  const selectedPassage = existingPassages.find((p) => p.id === selectedPassageId) ?? null;

  useEffect(() => {
    if (passageMode !== "existing" || !form.examType || !form.subject || !form.year) return;
    let cancelled = false;
    setLoadingPassages(true);
    passagesApi
      .listPassages({
        examType: form.examType as ExamType,
        subject: form.subject,
        year: form.year,
        limit: 50,
      })
      .then((res) => {
        if (!cancelled) setExistingPassages(res.data);
      })
      .catch(() => {
        if (!cancelled) setExistingPassages([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPassages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [passageMode, form.examType, form.subject, form.year]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const isMcqLike = MCQ_LIKE.includes(form.type);
  const availableTypes =
    form.examType && MCQ_ONLY_EXAMS.has(form.examType as ExamType)
      ? (["mcq"] as QuestionType[])
      : (Object.keys(TYPE_CONFIG) as QuestionType[]);

  function updateOption(idx: number, text: string) {
    const next = [...form.options];
    next[idx] = { ...next[idx], text };
    set("options", next);
  }

  const isValid =
    form.examType &&
    form.subject &&
    form.year &&
    form.questionText.trim().length >= 10 &&
    (!isMcqLike || form.options.every((o) => o.text.trim().length > 0)) &&
    (passageMode !== "existing" || !!selectedPassageId) &&
    (passageMode !== "new" || !!(newPassage.passageText.trim() || newPassageImage));

  async function handleSubmit(publishNow: boolean) {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      let passageId: string | null | undefined = undefined;
      if (passageMode === "existing") {
        passageId = selectedPassageId;
      } else if (passageMode === "new") {
        const passage = await passagesApi.createPassage({
          examType: form.examType as ExamType,
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

      const payload: questionsApi.CreateQuestionPayload = {
        examType: form.examType as ExamType,
        candidateType: isCandidateTypeExam(form.examType as ExamType)
          ? (form.candidateType || null)
          : null,
        subject: form.subject as any,
        year: form.year,
        topic: form.topic || undefined,
        difficulty: form.difficulty,
        type: form.type,
        questionText: form.questionText,
        questionImageUrl: questionImage?.url || undefined,
        isActive: publishNow,
        ...(passageId !== undefined && { passageId }),
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
        if (form.type === "theory" && essayStructure.length > 0) {
          payload.structure = essayStructure;
        }
      }
      if (form.explanationText) {
        payload.explanations = [
          { text: form.explanationText, imageUrl: explanationImage?.url || null },
        ];
      }

      await questionsApi.createQuestion(payload);
      setSuccess(publishNow ? "Question published!" : "Question saved as draft.");
      setTimeout(() => {
        router.push(`/admin/questions/${form.examType}`);
      }, 1200);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";
  const labelCls = "block text-[12px] font-semibold text-green-900 mb-1.5";

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <p className="text-[16px] font-semibold text-green-900">{success}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={form.examType ? `/admin/questions/${form.examType}` : "/admin/questions"}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-green-800 transition-colors mb-6 text-[13px]">
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 className="font-serif text-2xl text-green-900 mb-1">Add Question</h1>
      <p className="text-[13px] text-text-muted mb-6">
        Fill in the details below — save as a draft or publish immediately.
      </p>

      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600 font-medium flex items-start gap-2">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      <div
        className="bg-white rounded-2xl border p-6 space-y-5"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        {/* Exam / Subject / Year */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Exam Type *</label>
            <select
              title="exam type"
              value={form.examType}
              onChange={(e) => {
                const et = e.target.value as ExamType;
                set("examType", et);
                if (MCQ_ONLY_EXAMS.has(et)) set("type", "mcq");
                if (!isCandidateTypeExam(et)) set("candidateType", "");
              }}
              className={inputCls}>
              <option value="">Select…</option>
              {(Object.keys(EXAM_LABELS) as ExamType[]).map((et) => (
                <option key={et} value={et}>
                  {EXAM_LABELS[et].name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Subject *</label>
            <select
              title="subject"
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className={inputCls}>
              <option value="">Select…</option>
              {ALL_SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Year *</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => set("year", parseInt(e.target.value, 10) || form.year)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Candidate type — only shown for exams that actually register
            school vs. private candidates separately. Left unset ("Both"),
            the question applies to either stream. */}
        {isCandidateTypeExam(form.examType as ExamType) && (
          <div>
            <label className={labelCls}>Candidate Type</label>
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
            <p className="text-[11px] text-text-muted mt-1">
              Only set this if the paper actually differs for{" "}
              {CANDIDATE_TYPE_CONFIG.school.shortLabel.toLowerCase()} vs.{" "}
              {CANDIDATE_TYPE_CONFIG.private.shortLabel.toLowerCase()} candidates — leave as
              &quot;Both&quot; otherwise.
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Difficulty</label>
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
            <label className={labelCls}>Question Type</label>
            <select
              title="type"
              value={form.type}
              onChange={(e) => set("type", e.target.value as QuestionType)}
              disabled={!!form.examType && MCQ_ONLY_EXAMS.has(form.examType as ExamType)}
              className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONFIG[t].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Topic</label>
            <input
              type="text"
              value={form.topic}
              onChange={(e) => set("topic", e.target.value)}
              placeholder="e.g. Quadratic Equations"
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
              {!form.examType || !form.subject || !form.year ? (
                <p className="text-[12px] text-text-muted">
                  Select exam type, subject, and year above first.
                </p>
              ) : loadingPassages ? (
                <p className="text-[12px] text-text-muted flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Loading passages…
                </p>
              ) : existingPassages.length === 0 ? (
                <p className="text-[12px] text-text-muted">
                  No passages found for this exam/subject/year yet — switch to &quot;Write new
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
              <p className="text-[11px] text-text-muted">
                Saved once, then linked to this question — add more questions afterward using
                &quot;Attach existing&quot; to build a full comprehension set.
              </p>
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

        {/* Question text */}
        <div>
          <label className={labelCls}>Question Text *</label>
          <textarea
            rows={4}
            value={form.questionText}
            onChange={(e) => set("questionText", e.target.value)}
            placeholder="Type the question here…"
            className={inputCls}
          />
        </div>

        <ImageUploadField
          label="Question Image (optional)"
          value={questionImage}
          onChange={setQuestionImage}
        />

        {/* MCQ options or open-ended fields */}
        {isMcqLike ? (
          <div>
            <label className={labelCls}>Options — select the correct one *</label>
            <div className="space-y-2">
              {form.options.map((opt, idx) => (
                <div key={opt.label} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => set("correctLabel", opt.label)}
                    className={`w-9 h-9 rounded-lg font-bold text-[13px] shrink-0 transition-all ${
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className={labelCls}>Max Score</label>
              <input
                type="number"
                min={1}
                value={form.maxScore}
                onChange={(e) => set("maxScore", parseInt(e.target.value, 10) || 1)}
                className={inputCls}
              />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Model Answer / Mark Scheme</label>
              <textarea
                rows={2}
                value={form.modelAnswer}
                onChange={(e) => set("modelAnswer", e.target.value)}
                placeholder="Used as grading guidance for AI-assisted scoring"
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
          <label className={labelCls}>Explanation (optional)</label>
          <textarea
            rows={2}
            value={form.explanationText}
            onChange={(e) => set("explanationText", e.target.value)}
            placeholder="Shown to students after they answer"
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
          onClick={() => handleSubmit(false)}
          disabled={!isValid || submitting}
          className="flex-1 py-3.5 rounded-xl border-2 border-green-800 text-green-800 font-semibold hover:bg-green-50 transition-all text-[14px] disabled:opacity-40 flex items-center justify-center gap-2">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={!isValid || submitting}
          className="flex-1 py-3.5 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700 transition-all text-[14px] disabled:opacity-40 flex items-center justify-center gap-2">
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Publish Now
        </button>
      </div>
    </div>
  );
}

export default function CreateQuestionPage() {
  return (
    <Suspense
      fallback={<Loader2 size={24} className="animate-spin text-green-800 mx-auto mt-24" />}>
      <CreateQuestionForm />
    </Suspense>
  );
}
