"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { AllAnswers, Answer, Question, SubjectId } from "@/lib/constants/mcq";
import InstructionsPage from "./Instructions";
import QuestionNavigator from "./QuestionNavigator";
import { ExamLoader } from "@/lib/loaders";
import LeftQuestion from "./LeftQuestion";
import SubmitModel from "./SubmitModel";
import CbtNav from "../../../components/CbtNav";
import CalculatorModal from "../../../components/CalculatorModal";
import {
  getPracticeSession,
  completePart,
  partRoute,
  resultsRoute,
  SessionMode,
  type McqAnswerSubmission,
} from "@/lib/session/practiceSession";
import { submitAnswer as apiSubmitAnswer } from "@/lib/api/exams";
import { adaptToMcqQuestion } from "@/lib/mcq/mcqAdapter";
import { buildInitialAnswers } from "@/lib/mcq/buildInitialAnswers";
import { extractErrorMessage } from "@/lib/api/client";

type Subject = {
  id: string;
  name: string;
  questionCount: number;
};

export default function CBTExamClientPage({ id }: { id: string }) {
  const router = useRouter();
  const sessionId = id as string;

  const session = useMemo(() => getPracticeSession(sessionId), [sessionId]);

  // Real MCQ questions for this session, grouped by subject — one flat
  // list from the backend (a mixed mcq+theory session includes both
  // types; this page only ever shows the mcq ones).
  const mcqQuestionsBySubject = useMemo(() => {
    const map: Record<string, typeof session extends null ? never : NonNullable<typeof session>["questions"]> = {};
    if (!session) return map;
    for (const q of session.questions) {
      if (q.type !== "mcq") continue;
      (map[q.subject] ??= []).push(q);
    }
    return map;
  }, [session]);

  const SUBJECTS: Subject[] = useMemo(() => {
    return Object.entries(mcqQuestionsBySubject).map(([subjectId, qs]) => ({
      id: subjectId,
      name: subjectId,
      questionCount: qs.length,
    }));
  }, [mcqQuestionsBySubject]);

  const mode: SessionMode = session?.mode ?? "exam";
  const [examStarted, setExamStarted] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<SubjectId>(SUBJECTS[0]?.id ?? "");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<AllAnswers>({});
  const [timeRemaining, setTimeRemaining] = useState((session?.config.timeLimit ?? 120) * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  // Practice-mode reveal data returned by the backend right after each
  // submitted answer — keyed by sessionQuestionId since that's the only
  // stable real identifier (array index resets when switching subjects).
  const [revealedData, setRevealedData] = useState<Record<string, { correctLabel: string; explanation?: string }>>(
    {},
  );
  const [isFinishing, setIsFinishing] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!currentSubject && SUBJECTS[0]) setCurrentSubject(SUBJECTS[0].id);
  }, [SUBJECTS, currentSubject]);

  // Real questions for the active subject, adapted into the shape the
  // existing player UI expects — revealed correct answers merged in.
  const currentQuestions: Question[] = useMemo(() => {
    const dtos = mcqQuestionsBySubject[currentSubject] ?? [];
    return dtos.map((dto, i) => adaptToMcqQuestion(dto, i, revealedData[dto.sessionQuestionId]?.correctLabel));
  }, [mcqQuestionsBySubject, currentSubject, revealedData]);

  const currentAnswers: Answer[] = useMemo(
    () => allAnswers[currentSubject] ?? buildInitialAnswers(currentQuestions),
    [allAnswers, currentSubject, currentQuestions],
  );

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const totalQuestions = currentQuestions.length;

  useEffect(() => {
    if (!examStarted) return;
    setAllAnswers((prev: Record<SubjectId, Answer[]>) => {
      if (prev[currentSubject]) return prev;
      return { ...prev, [currentSubject]: buildInitialAnswers(currentQuestions) };
    });
    setCurrentQuestionIndex(0);
  }, [currentSubject, examStarted, currentQuestions]);

  // ── Finish this part: submit everything, hand off to next part or results ──
  const finishMcqPart = useCallback(async () => {
    if (!session) {
      router.push(`/dashboard/practice/session/${sessionId}/results`);
      return;
    }
    setIsFinishing(true);
    try {
      // Safety-net bulk submission (per-select submission already covers
      // the common path — this catches anything that failed silently).
      const submissions: McqAnswerSubmission[] = [];
      for (const dtos of Object.values(mcqQuestionsBySubject)) {
        const subj = dtos[0]?.subject;
        if (!subj) continue;
        const answers = allAnswers[subj] ?? [];
        dtos.forEach((dto, i) => {
          const selected = answers[i]?.selectedOption;
          if (selected) submissions.push({ sessionQuestionId: dto.sessionQuestionId, selectedLabel: selected });
        });
      }
      const { nextPart, finalSession } = await completePart(sessionId, "mcq", submissions);
      if (nextPart) {
        router.push(partRoute(nextPart, sessionId));
      } else {
        router.push(resultsRoute(sessionId));
      }
      void finalSession;
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setIsFinishing(false);
    }
  }, [session, sessionId, allAnswers, mcqQuestionsBySubject, router]);

  // ── Timer ──────────────────────────────────────────────
  const handleAutoSubmit = useCallback(() => {
    setIsSubmitted(true);
    finishMcqPart();
  }, [finishMcqPart]);

  useEffect(() => {
    if (!examStarted || isSubmitted) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted, isSubmitted, handleAutoSubmit]);

  // ── Answer helpers ─────────────────────────────────────
  const updateCurrentSubjectAnswers = useCallback(
    (updater: (prev: Answer[]) => Answer[]) => {
      setAllAnswers((prev: AllAnswers) => ({
        ...prev,
        [currentSubject]: updater(prev[currentSubject] ?? buildInitialAnswers(currentQuestions)),
      }));
    },
    [currentSubject, currentQuestions],
  );

  const handleSelectOption = useCallback(
    (optionLetter: string) => {
      if (isSubmitted || !currentQuestion) return;
      updateCurrentSubjectAnswers((prev) =>
        prev.map((ans, idx) =>
          idx === currentQuestionIndex ? { ...ans, selectedOption: optionLetter } : ans,
        ),
      );

      // Submit immediately — cheap (no AI cost for MCQ), and in practice
      // mode this is what unlocks the correct-answer reveal.
      const sqId = currentQuestion.sessionQuestionId;
      if (!sqId) return;
      apiSubmitAnswer(sessionId, { sessionQuestionId: sqId, selectedLabel: optionLetter })
        .then((res) => {
          if (res.correctLabel) {
            setRevealedData((prev) => ({
              ...prev,
              [sqId]: { correctLabel: res.correctLabel!, explanation: res.explanation },
            }));
          }
        })
        .catch(() => {
          // Non-fatal — the bulk submission in finishMcqPart is a safety net.
        });
    },
    [isSubmitted, currentQuestionIndex, currentQuestion, updateCurrentSubjectAnswers, sessionId],
  );

  const handleFlagQuestion = useCallback(() => {
    if (isSubmitted) return;
    updateCurrentSubjectAnswers((prev) =>
      prev.map((ans, idx) =>
        idx === currentQuestionIndex ? { ...ans, isFlagged: !ans.isFlagged } : ans,
      ),
    );
  }, [isSubmitted, currentQuestionIndex, updateCurrentSubjectAnswers]);

  const markVisited = useCallback(
    (index: number) => {
      updateCurrentSubjectAnswers((prev) =>
        prev.map((ans, idx) => (idx === index ? { ...ans, isVisited: true } : ans)),
      );
    },
    [updateCurrentSubjectAnswers],
  );

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      markVisited(currentQuestionIndex + 1);
      setCurrentQuestionIndex((i) => i + 1);
    }
  }, [currentQuestionIndex, totalQuestions, markVisited]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) setCurrentQuestionIndex((i) => i - 1);
  }, [currentQuestionIndex]);

  const handleNavigateToQuestion = useCallback(
    (index: number) => {
      markVisited(index);
      setCurrentQuestionIndex(index);
    },
    [markVisited],
  );

  const handleReadAloud = useCallback(() => {
    if (!currentQuestion) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
    utterance.rate = 0.9;
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [currentQuestion, isSpeaking]);

  useEffect(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, currentSubject]);

  // ── Global keyboard shortcuts ──────────────────────────
  useEffect(() => {
    if (!examStarted || isSubmitted) return;

    const handler = (e: KeyboardEvent) => {
      if (showCalculator) return;

      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlePrevious();
          break;
        case "a":
        case "A":
          handleSelectOption("A");
          break;
        case "b":
        case "B":
          handleSelectOption("B");
          break;
        case "c":
        case "C":
          handleSelectOption("C");
          break;
        case "d":
        case "D":
          handleSelectOption("D");
          break;
        case "f":
        case "F":
          handleFlagQuestion();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    examStarted,
    isSubmitted,
    showCalculator,
    handleNext,
    handlePrevious,
    handleSelectOption,
    handleFlagQuestion,
  ]);

  const confirmSubmit = useCallback(() => {
    setIsSubmitted(true);
    setShowSubmitModal(false);
    finishMcqPart();
  }, [finishMcqPart]);

  const currentSelectedOption = currentAnswers[currentQuestionIndex]?.selectedOption ?? null;
  const isCurrentFlagged = currentAnswers[currentQuestionIndex]?.isFlagged ?? false;

  const totalAnswered = useMemo(
    () => currentAnswers.filter((a) => a.selectedOption !== null).length,
    [currentAnswers],
  );

  const isLowTime = timeRemaining < 300;

  // ── Guards ─────────────────────────────────────────────
  if (!examStarted) {
    return <InstructionsPage onStart={() => setExamStarted(true)} />;
  }

  if (!session || !currentQuestion || isFinishing) {
    return <ExamLoader />;
  }

  /* ── RENDER ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-cream">
      {/* ── Top Nav ─────────────────────────────────────── */}
      <CbtNav
        setShowCalculator={setShowCalculator}
        handleFlagQuestion={handleFlagQuestion}
        isCurrentFlagged={isCurrentFlagged}
        isLowTime={isLowTime}
        timeRemaining={timeRemaining}
      />
      {/* ── Subject tabs ─────────────────────────────────── */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-green-800 flex items-center justify-center text-gold font-serif text-lg"
            aria-hidden="true">
            {session.config.examType?.[0] ?? "S"}
          </div>
          <div>
            <div className="text-[13px] font-bold text-green-800 uppercase">
              {session.config.examType ?? "Practice"} Session
            </div>
            <div className="text-[11px] text-text-muted capitalize">{mode} mode</div>
          </div>
        </div>
        <button
          onClick={() => setShowSubmitModal(true)}
          className="bg-green-800 text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:bg-green-700 transition-all">
          Submit
        </button>
      </div>

      <div className="bg-green-800/90 px-6" role="tablist" aria-label="Subjects">
        <div className="flex gap-1 overflow-x-auto">
          {SUBJECTS.map((subject) => {
            const isActive = currentSubject === subject.id;
            return (
              <button
                key={subject.id}
                role="tab"
                aria-label={`${subject.name}${isActive ? " (current subject)" : ""}`}
                onClick={() => setCurrentSubject(subject.id)}
                className={`px-6 py-3 text-[13px] font-semibold uppercase transition-all relative whitespace-nowrap ${
                  isActive ? "text-gold border-b-2 border-gold" : "text-white/60 hover:text-white/80"
                }`}>
                {subject.name}
              </button>
            );
          })}
        </div>
      </div>

      {showCalculator && <CalculatorModal onClose={() => setShowCalculator(false)} />}

      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LeftQuestion
            currentQuestionIndex={currentQuestionIndex}
            handleNext={handleNext}
            handlePrevious={handlePrevious}
            currentSelectedOption={currentSelectedOption}
            handleSelectOption={handleSelectOption}
            currentQuestion={currentQuestion}
            totalQuestions={totalQuestions}
            handleReadAloud={handleReadAloud}
            mode={mode}
            isRevealed={!!revealedData[currentQuestion.sessionQuestionId ?? ""]}
            isSpeaking={isSpeaking}
          />
          <div>
            <QuestionNavigator
              totalQuestions={totalQuestions}
              currentIndex={currentQuestionIndex}
              answers={currentAnswers}
              onNavigate={handleNavigateToQuestion}
            />
          </div>
        </div>
      </main>

      {showSubmitModal && (
        <SubmitModel
          totalAnswered={totalAnswered}
          totalQuestions={totalQuestions}
          setShowSubmitModal={setShowSubmitModal}
          confirmSubmit={confirmSubmit}
        />
      )}
    </div>
  );
}
