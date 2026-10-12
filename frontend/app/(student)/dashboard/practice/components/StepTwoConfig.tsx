import { ChevronLeft } from "lucide-react";
import { SUBJECTS, TOPICS } from "@/lib/constants/practice";
import { PracticeConfig, CANDIDATE_TYPE_EXAMS } from "@/types/practice";
import { CbtPart, SessionMode } from "@/lib/session/practiceSession";
import SubjectSelector from "./SubjectSelector";
import SummaryPanel from "./SummaryPanel";
import QuestionTypeSection from "./QuestionTypeSection";
import CandidateTypeSection from "./CandidateTypeSection";
import SessionModeSection from "./SessionModeSection";
import YearSection from "./YearSection";
import McqSettingsSection from "./McqSettingsSection";
import TopicFocusSection from "./TopicFocusSection";
import { useAvailableQuestionCount } from "@/lib/hooks/useAvailableQuestionCount";
import type { BackendQuestionType } from "@/lib/api/exams";
import { useEffect } from "react";

interface StepTwoConfigProps {
  config: PracticeConfig;
  isJamb: boolean;
  theoryAvailable: boolean;
  startWith: CbtPart;
  sessionMode: SessionMode;
  selectedTopics: string[];
  canProceed: boolean;
  onUpdateConfig: (updates: Partial<PracticeConfig>) => void;
  onChangeStartWith: (id: CbtPart) => void;
  onChangeSessionMode: (mode: SessionMode) => void;
  onChangeTopics: (topics: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTwoConfig({
  config,
  isJamb,
  theoryAvailable,
  startWith,
  sessionMode,
  selectedTopics,
  canProceed,
  onUpdateConfig,
  onChangeStartWith,
  onChangeSessionMode,
  onChangeTopics,
  onNext,
  onBack,
}: StepTwoConfigProps) {
  const availableTopics =
    !isJamb && config.subject && TOPICS[config.subject] ? TOPICS[config.subject] : [];

  // Same rule createPracticeSession uses to pick the backend question type,
  // so the count shown here is the pool the session will really draw from.
  const isLongForm = config.questionType === "THEORY" || config.questionType === "PRACTICAL";
  // Mixed = an MCQ part + a theory part, each with its own count.
  const isMixed = config.questionType === "ALL" && theoryAvailable;
  const countType: BackendQuestionType =
    config.questionType === "THEORY"
      ? "theory"
      : config.questionType === "PRACTICAL"
        ? "practical"
        : "mcq";

  const { count: availableCount, loading: loadingCount } = useAvailableQuestionCount(
    config,
    countType,
    canProceed,
  );

  const { count: theoryAvailableCount, loading: loadingTheoryCount } = useAvailableQuestionCount(
    config,
    "theory",
    canProceed && isMixed,
  );

  // Keep the chosen number inside what actually exists: default to
  // "as many as available, up to 40", and pull it back down if the
  // selection changes to something with fewer questions.
  const chosen = config.numQuestions;
  useEffect(() => {
    if (availableCount === null || availableCount === 0) return;
    if (chosen === undefined || chosen > availableCount) {
      onUpdateConfig({ numQuestions: Math.min(availableCount, 40) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableCount, chosen]);

  // Same for the theory part of a mixed session (default: up to 5 — theory
  // questions are long, multi-part exam questions)
  const chosenTheory = config.numTheoryQuestions;
  useEffect(() => {
    if (!isMixed || theoryAvailableCount === null || theoryAvailableCount === 0) return;
    if (chosenTheory === undefined || chosenTheory > theoryAvailableCount) {
      onUpdateConfig({ numTheoryQuestions: Math.min(theoryAvailableCount, 5) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMixed, theoryAvailableCount, chosenTheory]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {config.examType !== "PROFESSIONAL" && SUBJECTS[config.examType!] && (
            <SubjectSelector
              examType={config.examType!}
              subjects={SUBJECTS[config.examType!]}
              isJamb={isJamb}
              selected={isJamb ? (config.subjects ?? []) : config.subject ? [config.subject] : []}
              onChange={(vals) => {
                if (isJamb) {
                  onUpdateConfig({ subjects: vals, subject: undefined });
                } else {
                  onUpdateConfig({ subject: vals[0], subjects: undefined });
                }
                onChangeTopics([]);
              }}
            />
          )}

          {config.examType !== "JAMB" && config.examType !== "PROFESSIONAL" && (
            <QuestionTypeSection
              questionType={config.questionType}
              theoryAvailable={theoryAvailable}
              startWith={startWith}
              onChangeType={(id) => onUpdateConfig({ questionType: id })}
              onChangeStartWith={onChangeStartWith}
            />
          )}

          {config.examType && CANDIDATE_TYPE_EXAMS.includes(config.examType) && (
            <CandidateTypeSection
              value={config.candidateType}
              onChange={(candidateType) => onUpdateConfig({ candidateType })}
            />
          )}

          <SessionModeSection sessionMode={sessionMode} onChange={onChangeSessionMode} />

          <YearSection year={config.year} onChange={(year) => onUpdateConfig({ year })} />

          <McqSettingsSection
            numQuestions={config.numQuestions}
            timeLimit={config.timeLimit}
            availableCount={availableCount}
            loadingCount={loadingCount}
            isLongForm={isLongForm}
            theory={
              isMixed
                ? {
                    value: config.numTheoryQuestions,
                    availableCount: theoryAvailableCount,
                    loading: loadingTheoryCount,
                    onChange: (n) => onUpdateConfig({ numTheoryQuestions: n }),
                  }
                : undefined
            }
            onChangeNumQuestions={(n) => onUpdateConfig({ numQuestions: n })}
            onChangeTimeLimit={(n) => onUpdateConfig({ timeLimit: n })}
          />

          <TopicFocusSection
            subject={config.subject}
            availableTopics={availableTopics}
            selectedTopics={selectedTopics}
            onChange={onChangeTopics}
          />
        </div>

        <div className="lg:col-span-1">
          <SummaryPanel
            config={config}
            topics={selectedTopics}
            onNext={onNext}
            isReady={canProceed && availableCount !== 0 && !(isMixed && theoryAvailableCount === 0)}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[13px] text-gray-500 hover:text-gray-700 font-medium transition-colors">
          <ChevronLeft size={16} /> Back to exam selection
        </button>
      </div>
    </>
  );
}
