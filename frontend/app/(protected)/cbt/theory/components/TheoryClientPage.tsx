"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, LogOut, Calculator, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import SubmitModel from "../../../components/SubmitModel";
import TimeUpModal from "../../../components/TimeUpModal";
import Instructions from "./Instructions";
import { AIResult, Answer, AnswerType, ExamMode, SubQuestion } from "@/types/examsTypes";
import { formatTime } from "@/utils/formartTimer";
import SubQuestionAnswer from "./SubQuestionAnswer";
import CalculatorModal from "../../../components/CalculatorModal";
import PassagePanel from "../../../components/PassagePanel";
import Image from "next/image";
import {
  getPracticeSession,
  completePart,
  resultsRoute,
  type EssayAnswerSubmission,
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
  const session = getPracticeSession(sessionId);

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
  const [mode, setMode] = useState<ExamMode>(session?.mode ?? "practice");
  const [timeRemaining, setTimeRemaining] = useState((session?.config.timeLimit ?? 120) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [aiResults, setAiResults] = useState<Record<string, AIResult>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);

  const isSubmittedRef = useRef(false);

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

  // Timer — only runs after exam starts and before submission
  useEffect(() => {
    if (!examStarted || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmittedRef.current) {
            isSubmittedRef.current = true;
            setIsSubmitted(true);
            setShowTimeUpModal(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, isSubmitted]);

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

  /**
   * "Reveal Answer & Score with AI" on ANY part scores the whole question
   * it belongs to: the backend stores one answer row per question, so every
   * part is submitted together, then each part is scored independently
   * against its own marks. Practice mode only (backend enforces this).
   */
  const handleAIScore = async (subQuestion: SubQuestion) => {
    const group =
      essayQuestions.find((q) => q.subQuestions.some((s) => s.id === subQuestion.id))?.subQuestions ??
      [subQuestion];
    setAiLoading((prev) => ({ ...prev, ...Object.fromEntries(group.map((s) => [s.id, true])) }));
    try {
      const submission = await buildSubmission(group, { includeBlank: true });
      if (!submission) return;
      await submitAnswer(sessionId, submission);

      const score = await scoreAnswerNow(sessionId, subQuestion.sessionQuestionId);
      setAiResults((prev) => {
        const next = { ...prev };
        if (score.parts?.length) {
          for (const sub of group) {
            const part = score.parts.find((p) => p.path === sub.path);
            if (!part) continue;
            next[sub.id] = {
              id: part.aiEssayScoreId ?? undefined,
              score: part.awardedScore,
              maxScore: part.maxScore,
              feedback: part.feedback,
              strengths: part.strengths,
              improvements: part.improvements,
              showSolution: false,
            };
          }
        } else if (score.id) {
          next[group[0].id] = {
            id: score.id,
            score: score.aiScore,
            maxScore: score.maxScore,
            feedback: score.aiFeedback,
            strengths: score.strengths,
            improvements: score.improvements,
            showSolution: false,
          };
        }
        return next;
      });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setAiLoading((prev) => ({ ...prev, ...Object.fromEntries(group.map((s) => [s.id, false])) }));
    }
  };

  const handleToggleSolution = (subId: string) => {
    setAiResults((prev) => ({
      ...prev,
      [subId]: { ...prev[subId], showSolution: !prev[subId].showSolution },
    }));
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
        const submission = await buildSubmission(question.subQuestions, { includeBlank: false });
        if (submission) submissions.push(submission);
      }

      await completePart(sessionId, "theory", submissions);
      router.push(resultsRoute(sessionId));
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setIsFinalizing(false);
    }
  };

  const confirmSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitModal(false);
    finishTheoryPart();
  };

  const isLowTime = timeRemaining < 300;

  // Show instructions screen until the student starts
  if (!examStarted)
    return (
      <Instructions
        mode={mode}
        modeLocked={!!session}
        onStart={(m) => {
          setMode(m);
          setAnswers(buildInitialAnswers());
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
            <div
              className={`px-4 py-1.5 rounded-lg font-mono font-bold text-[15px] flex items-center gap-2 transition-colors ${
                isLowTime ? "bg-red-500 text-white" : "bg-yellow-400 text-green-900"
              }`}
              aria-live="polite"
              aria-label={`Time remaining: ${formatTime(timeRemaining)}`}>
              <Clock size={16} aria-hidden="true" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
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
            Submit
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
            <div className="border-b p-5 bg-gradient-to-r from-green-50 to-white">
              <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600" aria-hidden="true" />
                <span className="text-[15px] font-bold text-green-800">{question.title}</span>
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
                      className="flex items-start gap-2 mb-3 bg-green-50/60 border border-green-100 rounded-lg px-3 py-2"
                      style={{ marginLeft: (firstChangedDepth + hIdx) * 12 }}>
                      <span className="font-bold text-green-900 text-sm shrink-0">{h.label}</span>
                      {h.text && <span className="text-sm text-green-900/80 leading-relaxed">{h.text}</span>}
                    </div>
                  ))}
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-green-800 text-base shrink-0">{sub.label}</span>
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
                  {aiLoading[sub.id] && (
                    <div className="mt-3 flex items-center gap-2 text-green-700 text-sm">
                      <Loader2 size={16} className="animate-spin" />
                      <span>AI is scoring your answer…</span>
                    </div>
                  )}
                  <SubQuestionAnswer
                    subQuestion={sub}
                    answer={getAnswer(sub.id)}
                    onAnswerChange={(a) => updateAnswer(sub.id, a)}
                    mode={mode}
                    isSubmitted={isSubmitted}
                    aiResult={aiResults[sub.id]}
                    onAIScore={() => handleAIScore(sub)}
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
        />
      )}
    </div>
  );
}
