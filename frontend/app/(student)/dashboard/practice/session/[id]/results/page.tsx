"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, BarChart3, ArrowLeft, User, FileX2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getPracticeSession } from "@/lib/session/practiceSession";
import { getExamResults, type ResultsBreakdownItem, type ExamSessionDto } from "@/lib/api/exams";
import { extractErrorMessage } from "@/lib/api/client";
import { PROFESSIONAL_EXAMS, SECONDARY_EXAMS } from "@/lib/constants/practice";
import McqResultSection, { McqSubjectResult } from "./McqResultSection";
import TheoryResultSection from "./TheoryResultSection";
import { buildTheoryResults } from "@/lib/results/buildTheoryResults";
import {
  downloadResultPdf,
  McqBreakdownRow,
  TheoryBreakdownRow,
} from "@/lib/results/downloadResultPdf";

export default function PracticeResultsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const cachedSession = useMemo(() => getPracticeSession(sessionId), [sessionId]);
  const [studentName, setStudentName] = useState("Student");
  const [isDownloading, setIsDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backendSession, setBackendSession] = useState<ExamSessionDto | null>(null);
  const [breakdown, setBreakdown] = useState<ResultsBreakdownItem[]>([]);

  const loadResults = useCallback(async () => {
    const res = await getExamResults(sessionId);
    setBackendSession(res.session);
    setBreakdown(res.breakdown);
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getExamResults(sessionId)
      .then((res) => {
        if (cancelled) return;
        setBackendSession(res.session);
        setBreakdown(res.breakdown);
      })
      .catch((err) => {
        if (!cancelled) toast.error(extractErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Exam Mode is the only mode with a formal score. Practice is a learning review.
  const showScores = backendSession?.mode === "mock";

  // ── MCQ breakdown ──────────────────────────────────────
  const mcqItems = useMemo(() => breakdown.filter((b) => b.question.type === "mcq"), [breakdown]);
  // Practical questions are written in theory form and were previously dropped from the results entirely.
  const theoryItems = useMemo(
    () => breakdown.filter((b) => b.question.type === "theory" || b.question.type === "practical"),
    [breakdown],
  );

  const mcqSubjects: McqSubjectResult[] = useMemo(() => {
    const bySubject = new Map<string, ResultsBreakdownItem[]>();
    for (const item of mcqItems) {
      const subj = item.question.subject ?? "general";
      const list = bySubject.get(subj) ?? [];
      list.push(item);
      bySubject.set(subj, list);
    }
    return Array.from(bySubject.entries()).map(([subjectId, items]) => ({
      subject: { id: subjectId, name: subjectId, questionCount: items.length },
      questions: items.map((item, i) => ({
        id: i,
        text: item.question.questionText ?? "",
        options: (item.question.options ?? []).slice().sort((a, b) => a.order - b.order).map((o) => o.text),
        correctAnswer: item.question.correctLabel ?? "",
        explanation: item.question.explanations?.[0]?.text,
        subjectId,
        sessionQuestionId: item.sessionQuestionId,
        questionId: item.question.id,
        questionImageUrl: item.question.questionImageUrl,
        hasDiagram: !!item.question.questionImageUrl,
      })),
      selected: items.map((item) => item.yourAnswer?.selectedLabel ?? null),
    }));
  }, [mcqItems]);

  const mcqCorrect = mcqItems.filter((i) => i.yourAnswer?.isCorrect).length;
  const mcqTotal = mcqItems.length;
  const mcqPct = mcqTotal ? Math.round((mcqCorrect / mcqTotal) * 100) : 0;

  // ── Theory / practical breakdown (per part, keyed by stable ids) ──
  const theoryQuestions = useMemo(() => buildTheoryResults(theoryItems), [theoryItems]);

  const theoryScore = theoryItems.reduce((sum, i) => sum + (i.yourAnswer?.awardedScore ?? 0), 0);
  const theoryMax = theoryItems.reduce(
    (sum, i) => sum + (i.yourAnswer?.maxScore ?? i.question.maxScore ?? 10),
    0,
  );
  const theoryPct = theoryMax ? Math.round((theoryScore / theoryMax) * 100) : 0;

  const hasMcq = mcqTotal > 0;
  const hasTheory = theoryItems.length > 0;
  const tookBoth = hasMcq && hasTheory;

  const overallPct = backendSession?.percentage ?? (hasMcq ? mcqPct : theoryPct);

  // ── Labels ──────────────────────────────────────────────
  const examLabel = useMemo(() => {
    const config = cachedSession?.config;
    if (!config) return backendSession?.examType?.toUpperCase() ?? "Practice Session";
    const examName =
      config.examType === "PROFESSIONAL"
        ? (PROFESSIONAL_EXAMS.find((e) => e.id === config.professionalExam)?.name ??
          config.professionalExam)
        : (SECONDARY_EXAMS.find((e) => e.id === config.examType)?.name ?? config.examType);
    const subjectLabel = config.subjects?.length ? config.subjects.join(", ") : config.subject;
    return [examName, subjectLabel].filter(Boolean).join(" · ");
  }, [cachedSession, backendSession]);

  const modeLabel = backendSession?.mode === "mock" ? "Exam Mode" : "Practice Mode";
  const autoSubmitted = backendSession?.status === "timed_out";
  const ungradedCount = theoryQuestions.filter((q) => q.status === "ungraded").length;

  const handleDownload = async () => {
    if (!backendSession) return;
    setIsDownloading(true);
    try {
      const mcq = hasMcq
        ? {
            correct: mcqCorrect,
            total: mcqTotal,
            percentage: mcqPct,
            rows: mcqSubjects.flatMap((s) =>
              s.questions.map(
                (q, i): McqBreakdownRow => ({
                  subjectName: s.subject.name,
                  questionNumber: i + 1,
                  questionText: q.text,
                  selected: s.selected[i],
                  correctAnswer: q.correctAnswer,
                  isCorrect: s.selected[i] === q.correctAnswer,
                  explanation: q.explanation,
                }),
              ),
            ),
          }
        : undefined;

      const theory = hasTheory
        ? {
            totalScore: theoryScore,
            maxScore: theoryMax,
            percentage: theoryPct,
            rows: theoryQuestions.map(
              (q): TheoryBreakdownRow => ({
                questionNumber: Number(q.title.match(/\d+/)?.[0] ?? 0),
                marksGot: q.marksGot,
                marksTotal: q.marksTotal,
                subQuestions: q.parts.map(({ sub, result }) => ({
                  label: sub.label,
                  text: sub.text,
                  marksGot: result?.score ?? 0,
                  marksTotal: sub.marks ?? 10,
                  feedback: result?.feedback,
                })),
              }),
            ),
          }
        : undefined;

      await downloadResultPdf({
        studentName: studentName || "Student",
        sessionId,
        examLabel,
        modeLabel,
        dateLabel: new Date(backendSession.startedAt).toLocaleString(),
        mcq,
        theory,
        overallPercentage: tookBoth ? overallPct : undefined,
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-green-700" size={28} />
      </div>
    );
  }

  if (!backendSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          <FileX2 size={36} className="text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1.5">Result not found</h2>
          <p className="text-sm text-gray-500 mb-5">
            This session may have expired or was opened on a different device.
          </p>
          <button
            onClick={() => router.push("/dashboard/practice")}
            className="px-5 py-2.5 bg-green-800 text-white rounded-xl text-sm font-bold">
            Start a new practice
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => router.push("/dashboard/practice")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={15} /> Back to Practice
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-[12px] text-gray-600 mb-1">{showScores ? "Exam Result" : "Practice Review"}</p>
          <h1 className="text-[20px] font-extrabold text-gray-800 mb-1">{examLabel}</h1>
          <p className="text-[12px] text-gray-400 mb-4">
            {modeLabel} · Session {sessionId.slice(0, 8)}
          </p>

          {autoSubmitted && (
            <p role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px] font-semibold text-amber-900">
              Time ran out, so this exam was submitted automatically with the answers you had saved.
            </p>
          )}

          {showScores ? (
            <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between">
              <span className="text-[13px] font-bold text-green-900">Overall Score</span>
              <span className="text-[20px] font-extrabold text-green-900">{overallPct}%</span>
            </div>
          ) : (
            <p className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-[13px] text-green-900">
              Practice sessions are for learning, so no formal score is calculated. Open any question below to
              review the answer, the explanation and AI feedback.
            </p>
          )}

          {showScores && ungradedCount > 0 && (
            <p role="alert" className="mb-5 rounded-xl border border-red-300 bg-red-50 p-3 text-[13px] font-semibold text-red-900">
              {ungradedCount} written {ungradedCount === 1 ? "answer" : "answers"} could not be graded automatically and{" "}
              {ungradedCount === 1 ? "isn't" : "aren't"} counted yet. Open the question and press “Retry grading”.
            </p>
          )}

          {backendSession.xpEarned > 0 && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <span className="text-[13px] font-bold text-amber-800">XP Earned</span>
              <span className="text-[16px] font-extrabold text-amber-800">
                +{backendSession.xpEarned} XP
              </span>
            </div>
          )}

          <label className="flex items-center gap-2 text-[12px] text-gray-500 mb-1.5">
            <User size={13} /> Name on report
          </label>
          <input
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-600"
          />

          <div className="flex flex-col sm:flex-row gap-3">
            {showScores && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-800 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-60">
              <Download size={16} /> {isDownloading ? "Preparing…" : "Download Result"}
            </button>
            )}
            <button
              onClick={() => router.push("/dashboard/performance")}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all">
              <BarChart3 size={16} /> See Detailed Result Analysis
            </button>
          </div>
        </div>

        {hasMcq && (
          <McqResultSection
            showScores={showScores}
            correct={mcqCorrect}
            total={mcqTotal}
            percentage={mcqPct}
            subjects={mcqSubjects}
          />
        )}

        {hasTheory && (
          <TheoryResultSection
            sessionId={sessionId}
            showScores={showScores}
            onRegraded={loadResults}
            totalScore={theoryScore}
            maxScore={theoryMax}
            percentage={theoryPct}
            questions={theoryQuestions}
          />
        )}
      </div>

    </div>
  );
}
