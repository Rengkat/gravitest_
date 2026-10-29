"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, LogOut, Calculator, AlertCircle, CheckCircle, CheckCircle2, Circle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import SubmitModel from "../../../components/SubmitModel";
import TimeUpModal from "../../../components/TimeUpModal";
import Instructions from "./Instructions";
import { AIResult, Answer, AnswerType, ExamMode, SubQuestion } from "@/types/examsTypes";
import { formatTime } from "@/utils/formartTimer";
import { ExamLoader } from "@/lib/loaders";
import SessionProblem from "../../components/SessionProblem";
import { useExamCountdown } from "@/lib/session/useExamCountdown";
import { buildExamSummary, validateSessionForPlay } from "@/lib/session/examSummary";
import SubQuestionAnswer from "./SubQuestionAnswer";
import CalculatorModal from "../../../components/CalculatorModal";
import PassagePanel from "../../../components/PassagePanel";
import Image from "next/image";
import {
  getPracticeSession,
  syncPracticeSession,
  completePart,
  resultsRoute,
  type EssayAnswerSubmission,
  type PracticeSession,
  type SessionMode,
} from "@/lib/session/practiceSession";
import { scoreAnswerNow, submitAnswer } from "@/lib/api/exams";
import { groupTheoryQuestions } from "@/lib/theory/groupTheoryQuestions";
import { uploadDiagramDataUrl } from "@/lib/theory/uploadDiagram";
import { extractErrorMessage } from "@/lib/api/client";

/* ─────────────────────────────────────────────────────────
   Page component
───────────────────────────────────────────────────────── */
export default function CBTEssayClientPage({ id }: { id: string }) {
  const router = useRouter();
  const sessionId = id as string;
  // Cached copy first (instant), then re-synced with the SERVER so the exam clock and the
  // student's saved text survive a refresh.
  const [session, setSession] = useState<PracticeSession | null>(() => getPracticeSession(sessionId));
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    syncPracticeSession(sessionId).then(({ session: fresh, deadlineMs: d }) => {
      if (cancelled) return;
      if (fresh) setSession(fresh);
      setDeadlineMs(d);
      setSynced(true);
      // Already submitted / auto-submitted on the server → never re-enter the exam.
      if (fresh && fresh.backendSession.status !== "in_progress") router.replace(resultsRoute(sessionId));
    });
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  // Real theory questions for this session, grouped back into the
  // Question/SubQuestion shape the UI below was built against.
  const essayQuestions = useMemo(() => {
    if (!session) return [];
    // Practical questions are always written in theory form, so they share this page.
    return groupTheoryQuestions(
      session.questions.filter((q) => q.type === "theory" || q.type === "practical"),
    );
  }, [session]);

  const [examStarted, setExamStarted] = useState(false);
  // The mode is fixed when the session is created; there is no way to switch it mid-session.
  const mode: ExamMode = (session?.mode ?? "practice") satisfies SessionMode;
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [aiResults, setAiResults] = useState<Record<string, AIResult>>({});
  // Per-part (sub-question) grading state, keyed by the stable sub.id — never an array index.
  const [gradingIds, setGradingIds] = useState<ReadonlySet<string>>(new Set());
  const [gradeErrors, setGradeErrors] = useState<Record<string, string>>({});
  // What each part's answer looked like when it was graded, to flag an out-of-date grade.
  const [gradedFingerprints, setGradedFingerprints] = useState<Record<string, string>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  const isSubmittedRef = useRef(false);
  const gradingRef = useRef<Set<string>>(new Set()); // synchronous guard: repeated clicks never double-send

  function buildInitialAnswers(): Answer[] {
    return essayQuestions.flatMap((q) =>
      q.subQuestions.map((sub) => ({
        subQuestionId: sub.id,
        type: "type" as AnswerType,
        content: "",
        whiteboardData: undefined,
        graphData: undefined,
        constructionData: undefined,
        uploadData: null,
      })),
    );
  }

  // Restore what the student already typed (server-held) after a refresh.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!synced || hydratedRef.current || !session) return;
    hydratedRef.current = true;
    const savedBySq = new Map(session.questions.map((q) => [q.sessionQuestionId, q.savedAnswer]));
    setAnswers(
      buildInitialAnswers().map((a) => {
        const sub = essayQuestions.flatMap((q) => q.subQuestions).find((x) => x.id === a.subQuestionId);
        const saved = sub ? savedBySq.get(sub.sessionQuestionId) : undefined;
        if (!sub || !saved) return a;
        const text =
          sub.path === ""
            ? (saved.essayText ?? "")
            : (saved.partAnswers?.find((p) => p.path === sub.path)?.essayText ?? "");
        return text ? { ...a, content: text } : a;
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced, session]);

  const getAnswer = (subId: string): Answer =>
    answers.find((a) => a.subQuestionId === subId) ?? {
      subQuestionId: subId,
      type: "type",
      content: "",
      whiteboardData: undefined,
      graphData: undefined,
      constructionData: undefined,
      uploadData: null,
    };

  const updateAnswer = (subId: string, newAnswer: Answer) =>
    setAnswers((prev) =>
      prev.some((a) => a.subQuestionId === subId)
        ? prev.map((a) => (a.subQuestionId === subId ? newAnswer : a))
        : [...prev, newAnswer],
    );

  const isAnswered = (a: Answer) =>
    !!(a.content.trim() || a.whiteboardData || a.graphData || a.constructionData || a.uploadData);

  /** Uploads any drawn diagram / image for one answer part to R2 and returns its URLs. */
  const uploadPartImages = async (sub: SubQuestion, answer: Answer): Promise<string[]> => {
    const urls: string[] = [];
    const diagramData = answer.whiteboardData || answer.graphData || answer.constructionData;
    if (diagramData) {
      const url = await uploadDiagramDataUrl(diagramData, `diagram-${sub.id}`);
      if (url) urls.push(url);
    }
    if (answer.uploadData?.data.startsWith("data:image")) {
      const url = await uploadDiagramDataUrl(answer.uploadData.data, `upload-${sub.id}`);
      if (url) urls.push(url);
    }
    return urls;
  };

  /**
   * Builds the backend submission for ONE question row from all of its
   * answer boxes. Nested questions send one partAnswers entry per part
   * (matched by path); plain questions send flat essayText as before.
   * Returns null when nothing was answered.
   */
  const buildSubmission = async (
    subs: SubQuestion[],
    { includeBlank }: { includeBlank: boolean },
  ): Promise<EssayAnswerSubmission | null> => {
    const answered = subs.filter((sub) => isAnswered(getAnswer(sub.id)));
    if (!answered.length && !includeBlank) return null;
    const sessionQuestionId = subs[0].sessionQuestionId;

    if (subs.length === 1 && subs[0].path === "") {
      const answer = getAnswer(subs[0].id);
      const urls = await uploadPartImages(subs[0], answer);
      return {
        sessionQuestionId,
        essayText: answer.content || "",
        essayImageUrls: urls.length ? urls : undefined,
      };
    }

    const partAnswers = [];
    for (const sub of subs) {
      const answer = getAnswer(sub.id);
      const urls = isAnswered(answer) ? await uploadPartImages(sub, answer) : [];
      partAnswers.push({
        path: sub.path,
        essayText: answer.content || "",
        essayImageUrls: urls.length ? urls : undefined,
      });
    }
    return { sessionQuestionId, essayText: "", partAnswers };
  };

  /** Cheap fingerprint of an answer, to tell whether it changed after being graded. */
  const fingerprint = (a: Answer) =>
    JSON.stringify([
      a.content,
      a.whiteboardData?.length ?? 0,
      a.graphData?.length ?? 0,
      a.constructionData?.length ?? 0,
      a.uploadData?.name ?? "",
      a.uploadData?.data.length ?? 0,
    ]);

  /**
   * Practice mode "Check Answer": grades EXACTLY ONE part. Only that part's answer is submitted
   * and only that part is scored, so the other parts of the same question keep their own answer,
   * grade, feedback and loading state. (The backend enforces practice-only.)
   */
  const handleCheckPart = async (sub: SubQuestion) => {
    if (mode !== "practice" || isSubmittedRef.current) return;
    if (gradingRef.current.has(sub.id)) return; // already in flight
    const answer = getAnswer(sub.id);
    if (!isAnswered(answer)) {
      toast.error(`Write or upload an answer for ${sub.label} first.`);
      return;
    }
    gradingRef.current.add(sub.id);
    setGradingIds(new Set(gradingRef.current));
    setGradeErrors((prev) => {
      const { [sub.id]: _drop, ...rest } = prev;
      void _drop;
      return rest;
    });
    try {
      const submission = await buildSubmission([sub], { includeBlank: false });
      if (!submission) return;
      await submitAnswer(sessionId, submission);

      const score = await scoreAnswerNow(sessionId, sub.sessionQuestionId, sub.path || undefined);
      let result: AIResult;
      if (score.parts?.length) {
        const part = score.parts.find((p) => p.path === sub.path);
        if (!part || part.status === "failed") throw new Error("This part could not be graded right now.");
        result = {
          id: part.aiEssayScoreId ?? undefined,
          score: part.awardedScore,
          maxScore: part.maxScore,
          feedback: part.feedback,
          strengths: part.strengths,
          improvements: part.improvements,
          showSolution: false,
          explanation: score.explanation,
          modelAnswer: score.modelAnswer,
          needsReview: score.needsReview,
        };
      } else {
        result = {
          id: score.id ?? undefined,
          score: score.aiScore,
          maxScore: score.maxScore,
          feedback: score.aiFeedback,
          strengths: score.strengths,
          improvements: score.improvements,
          showSolution: false,
          explanation: score.explanation,
          modelAnswer: score.modelAnswer,
          needsReview: score.needsReview,
        };
      }
      // Writes ONLY this part's entry.
      setAiResults((prev) => ({ ...prev, [sub.id]: result }));
      setGradedFingerprints((prev) => ({ ...prev, [sub.id]: fingerprint(answer) }));
    } catch (err) {
      // The answer stays exactly as typed; the student can retry this part without losing anything.
      setGradeErrors((prev) => ({ ...prev, [sub.id]: extractErrorMessage(err) }));
    } finally {
      gradingRef.current.delete(sub.id);
      setGradingIds(new Set(gradingRef.current));
    }
  };

  const handleToggleSolution = (subId: string) => {
    setAiResults((prev) =>
      prev[subId] ? { ...prev, [subId]: { ...prev[subId], showSolution: !prev[subId].showSolution } } : prev,
    );
  };

  /**
   * Uploads any drawn diagrams, submits every answer, then hands off to
   * completePart — which calls the real backend's /complete internally
   * (this is always the last part in the plan today) and returns the
   * AI-graded final session. Answers already scored via handleAIScore in
   * practice mode are NOT re-scored (ExamsService.completeSession only
   * grades answers still in PENDING status), so instant-scored answers
   * don't cost a second AI call.
   */
  const finishTheoryPart = async () => {
    if (!session) {
      router.push(resultsRoute(sessionId));
      return;
    }
    setIsFinalizing(true);
    try {
      const submissions: EssayAnswerSubmission[] = [];
      for (const question of essayQuestions) {
        // Practice: parts already checked (and not edited since) are left alone, so they keep
        // their grade and are not re-uploaded or re-graded.
        const pending = question.subQuestions.filter(
          (sub) => !(aiResults[sub.id] && gradedFingerprints[sub.id] === fingerprint(getAnswer(sub.id))),
        );
        if (!pending.length) continue;
        const submission = await buildSubmission(pending, { includeBlank: false });
        if (submission) submissions.push(submission);
      }

      await completePart(sessionId, "theory", submissions);
      router.push(resultsRoute(sessionId));
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "time_expired") {
        // The server already closed and auto-submitted the exam with what was saved in time.
        router.push(resultsRoute(sessionId));
        return;
      }
      toast.error(extractErrorMessage(err));
      isSubmittedRef.current = false;
      setIsSubmitted(false);
      setIsFinalizing(false);
    }
  };

  // Always call the latest finishTheoryPart (timer callbacks must not hold a stale closure).
  const finishRef = useRef(finishTheoryPart);
  finishRef.current = finishTheoryPart;

  // Exam timer: derived from the SERVER's remaining time; fires once; Practice has none.
  const handleExpire = useCallback(() => {
    if (isSubmittedRef.current) return;
    isSubmittedRef.current = true;
    setIsSubmitted(true);
    setShowTimeUpModal(true);
    void finishRef.current();
  }, []);
  const timeRemaining = useExamCountdown(
    mode === "exam" ? deadlineMs : null,
    synced && examStarted && !isSubmitted,
    handleExpire,
  );

  // Exam mode: keep typed text safe on the server while the student works (so a refresh loses
  // nothing). Text only; diagrams/uploads are sent at submission. No feedback comes back.
  const savedTextRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (mode !== "exam" || !examStarted || isSubmitted) return;
    const t = setTimeout(async () => {
      for (const question of essayQuestions) {
        const changed = question.subQuestions.filter((sub) => {
          const text = getAnswer(sub.id).content;
          return text.trim() !== "" && savedTextRef.current[sub.id] !== text;
        });
        if (!changed.length) continue;
        const sessionQuestionId = changed[0].sessionQuestionId;
        const plain = changed.length === 1 && changed[0].path === "";
        try {
          await submitAnswer(
            sessionId,
            plain
              ? { sessionQuestionId, essayText: getAnswer(changed[0].id).content }
              : {
                  sessionQuestionId,
                  essayText: "",
                  partAnswers: changed.map((sub) => ({ path: sub.path, essayText: getAnswer(sub.id).content })),
                },
          );
          for (const sub of changed) savedTextRef.current[sub.id] = getAnswer(sub.id).content;
        } catch {
          // Best-effort: the final submission re-sends everything.
        }
      }
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, mode, examStarted, isSubmitted]);

  const confirmSubmit = () => {
    if (isSubmittedRef.current) return; // no duplicate submissions
    isSubmittedRef.current = true;
    setIsSubmitted(true);
    setShowSubmitModal(false);
    finishTheoryPart();
  };

  const isLowTime = timeRemaining !== null && timeRemaining < 300;

  // An unloadable / invalid configuration is reported explicitly — never papered over with defaults.
  const problem = validateSessionForPlay(session, "theory");
  if (problem && !isFinalizing && !isSubmitted) return <SessionProblem message={problem} />;
  if (!session || !synced) return <ExamLoader />;

  // Show instructions screen until the student starts
  if (!examStarted)
    return (
      <Instructions
        summary={buildExamSummary(session, "theory", essayQuestions.length)}
        onStart={() => {
          setAnswers((prev) => (prev.length ? prev : buildInitialAnswers()));
          setExamStarted(true);
        }}
      />
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav
        className="bg-green-800 text-white sticky top-0 z-40 shadow-lg"
        aria-label="Exam toolbar">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Exit exam">
              <LogOut size={16} />
              <span className="text-[13px] font-medium">Exit</span>
            </Link>
            <button
              onClick={() => setShowCalculator(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open calculator">
              <Calculator size={16} />
              <span className="text-[13px] font-medium">Calc</span>
            </button>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Report issue">
              <AlertCircle size={16} />
              <span className="text-[13px] font-medium">Report</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                mode === "practice" ? "bg-yellow-400 text-yellow-900" : "bg-blue-400 text-blue-900"
              }`}>
              {mode === "practice" ? "PRACTICE" : "EXAM"}
            </span>
            {timeRemaining === null ? (
              <div className="px-4 py-1.5 rounded-lg bg-white/15 text-white font-semibold text-[13px]" data-testid="untimed-badge">
                Practice · Untimed
              </div>
            ) : (
              <div
                role="timer"
                aria-live="off"
                className={`px-4 py-1.5 rounded-lg font-mono font-bold text-[15px] flex items-center gap-2 transition-colors ${
                  isLowTime ? "bg-red-500 text-white" : "bg-yellow-400 text-green-900"
                }`}
                aria-label={`Time remaining: ${formatTime(timeRemaining)}`}>
                <Clock size={16} aria-hidden="true" />
                <span>{formatTime(timeRemaining)}</span>
                {isLowTime && <span className="sr-only">Time is running low</span>}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Identity + submit bar */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-green-800 uppercase">
            {session?.config.examType ?? "Practice"} · Theory
          </div>
          <div className="text-[11px] text-gray-500 capitalize">{mode} mode</div>
        </div>
        {!isSubmitted ? (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-green-800 text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:bg-green-700 transition-all">
            {mode === "practice" ? "Finish" : "Submit"}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
            <CheckCircle size={16} />
            Submitted
          </div>
        )}
      </div>

      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}

      {/* Questions */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {essayQuestions.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            No theory questions matched this session&apos;s criteria.
          </div>
        )}
        {essayQuestions.map((question) => (
          <div
            key={question.id}
            className="bg-white rounded-xl border overflow-hidden"
            style={{ borderColor: "rgba(30,80,50,0.1)" }}>
            <div className="border-b border-green-200 p-5 bg-green-50">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-green-800 px-2 text-base font-extrabold text-white ring-2 ring-green-900/20"
                  aria-hidden="true">
                  {question.title.match(/\d+/)?.[0] ?? "•"}
                </span>
                <h2 className="text-lg font-extrabold text-green-900">{question.title}</h2>
                {(() => {
                  const total = question.subQuestions.length;
                  const done = question.subQuestions.filter((sub) => isAnswered(getAnswer(sub.id))).length;
                  const all = done === total && total > 0;
                  return (
                    <span
                      className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
                        all ? "border-green-700 bg-green-100 text-green-900" : "border-gray-400 bg-white text-gray-800"
                      }`}>
                      {all ? <CheckCircle2 size={14} aria-hidden="true" /> : <Circle size={14} aria-hidden="true" />}
                      {done} of {total} {total === 1 ? "part" : "parts"} answered
                    </span>
                  );
                })()}
              </div>
              {question.imageUrl && (
                <div className="mt-3">
                  <Image
                    src={question.imageUrl}
                    width={500}
                    height={500}
                    alt={`Diagram for ${question.title}`}
                    className="max-w-full rounded-lg border border-gray-200 max-h-72 object-contain"
                  />
                </div>
              )}
            </div>

            <PassagePanel passage={question.passage} />

            <div className="p-5 space-y-6">
              {question.instructions && (
                <p className="text-sm text-gray-600">{question.instructions}</p>
              )}
              {question.subQuestions.map((sub, subIdx) => {
                // Print only the ancestor headings that changed since the previous part
                const prevTrail = question.subQuestions[subIdx - 1]?.headingTrail ?? [];
                const trail = sub.headingTrail ?? [];
                const firstChangedDepth = trail.findIndex(
                  (h, depth) => prevTrail[depth]?.label !== h.label || prevTrail[depth]?.text !== h.text,
                );
                const headingsToShow = firstChangedDepth === -1 ? [] : trail.slice(firstChangedDepth);
                return (
                <div key={sub.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                  {headingsToShow.map((h, hIdx) => (
                    <div
                      key={`${sub.id}-h-${hIdx}`}
                      className="flex items-start gap-2 mb-3 bg-green-50 border border-green-300 rounded-lg px-3 py-2"
                      style={{ marginLeft: (firstChangedDepth + hIdx) * 12 }}>
                      <span className="font-extrabold text-green-900 text-base shrink-0">{h.label}</span>
                      {h.text && <span className="text-sm text-green-900 leading-relaxed">{h.text}</span>}
                    </div>
                  ))}
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <span className="font-extrabold text-green-900 text-lg shrink-0">{sub.label}</span>
                    <span className="text-sm text-gray-700 leading-relaxed flex-1">{sub.text}</span>
                    {sub.marks && (
                      <span className="text-xs text-green-700 font-semibold shrink-0 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                        {sub.marks} marks
                      </span>
                    )}
                  </div>
                  {sub.imageUrl && (
                    <div className="mt-2 mb-3">
                      <Image
                        src={sub.imageUrl}
                        height={500}
                        width={500}
                        alt={`Diagram for sub-question ${sub.label}`}
                        className="max-w-full rounded-lg border border-gray-200 max-h-60 object-contain"
                      />
                    </div>
                  )}
                  <SubQuestionAnswer
                    subQuestion={sub}
                    answer={getAnswer(sub.id)}
                    onAnswerChange={(a) => updateAnswer(sub.id, a)}
                    mode={mode}
                    isSubmitted={isSubmitted}
                    aiResult={aiResults[sub.id]}
                    onAIScore={() => handleCheckPart(sub)}
                    isGrading={gradingIds.has(sub.id)}
                    gradeError={gradeErrors[sub.id] ?? null}
                    hasAnswer={isAnswered(getAnswer(sub.id))}
                    isStale={
                      !!aiResults[sub.id] && gradedFingerprints[sub.id] !== fingerprint(getAnswer(sub.id))
                    }
                    onToggleSolution={() => handleToggleSolution(sub.id)}
                    onElaborated={(subQuestionId, detailedFeedback) =>
                      setAiResults((prev) => ({
                        ...prev,
                        [subQuestionId]: { ...prev[subQuestionId], detailedFeedback },
                      }))
                    }
                  />
                </div>
                );
              })}
            </div>
          </div>
        ))}

        {isFinalizing && (
          <div className="flex items-center justify-center gap-2 text-green-700 text-sm py-6">
            <Loader2 size={18} className="animate-spin" />
            <span>Submitting for grading…</span>
          </div>
        )}
      </div>

      {showSubmitModal && (
        <SubmitModel
          mode={mode}
          answers={answers}
          isAnswered={isAnswered}
          setShowSubmitModal={setShowSubmitModal}
          confirmSubmit={confirmSubmit}
        />
      )}

      {showTimeUpModal && (
        <TimeUpModal
          answers={answers}
          isAnswered={isAnswered}
          setShowTimeUpModal={setShowTimeUpModal}
          sessionId={sessionId}
          isSubmitting={isFinalizing}
        />
      )}
    </div>
  );
}
