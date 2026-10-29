import {
  BookOpen,
  ListChecks,
  Hash,
  Clock,
  Timer,
  CalendarDays,
  Target,
  Layers,
  ChevronLeft,
  Zap,
  UserCheck,
} from "lucide-react";
import { PracticeConfig, CANDIDATE_TYPE_EXAMS } from "@/types/practice";
import { CANDIDATE_TYPE_OPTIONS } from "@/lib/constants/practice";
import { CbtPart, SessionMode } from "@/lib/session/practiceSession";
import { resolveSessionSettings } from "@/lib/session/sessionSettings";

interface ExamMeta {
  name: string;
  bg: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface StepThreeSummaryProps {
  config: PracticeConfig;
  exam?: ExamMeta;
  sessionMode: SessionMode;
  selectedTopics: string[];
  theoryAvailable: boolean;
  startWith: CbtPart;
  onBack: () => void;
  onStart: () => void;
  isStarting?: boolean;
}

export default function StepThreeSummary({
  config,
  exam,
  sessionMode,
  selectedTopics,
  theoryAvailable,
  startWith,
  onBack,
  onStart,
  isStarting,
}: StepThreeSummaryProps) {
  const rows = [
    {
      icon: BookOpen,
      label: "Exam",
      value: config.examType === "PROFESSIONAL" ? config.professionalExam : config.examType,
    },
    ...(config.subjects?.length
      ? [{ icon: BookOpen, label: "Subjects", value: config.subjects.join(", ") }]
      : config.subject
        ? [{ icon: BookOpen, label: "Subject", value: config.subject }]
        : []),
    ...(config.examType && CANDIDATE_TYPE_EXAMS.includes(config.examType)
      ? [
          {
            icon: UserCheck,
            label: "Candidate Type",
            value:
              CANDIDATE_TYPE_OPTIONS.find((o) => o.id === config.candidateType)?.label ?? "Both",
          },
        ]
      : []),
    { icon: ListChecks, label: "Question Type", value: config.questionType || "MCQ" },
    {
      icon: Hash,
      label: "Questions",
      value:
        config.questionType === "ALL" && theoryAvailable
          ? `${config.numQuestions || 40} MCQ + ${config.numTheoryQuestions || 5} theory`
          : `${config.numQuestions || 40} questions`,
    },
    {
      icon: Clock,
      label: "Time",
      // Same resolver the session is created with — what you see here is what the exam timer uses.
      value:
        sessionMode === "practice"
          ? "Untimed"
          : `${resolveSessionSettings(config, "exam").durationMinutes} minutes`,
    },
    { icon: Timer, label: "Mode", value: sessionMode === "practice" ? "Practice" : "Exam" },
    ...(config.year ? [{ icon: CalendarDays, label: "Year", value: config.year }] : []),
    ...(selectedTopics.length > 0
      ? [{ icon: Target, label: "Topics", value: `${selectedTopics.length} selected` }]
      : []),
    ...(config.questionType === "ALL" && theoryAvailable
      ? [
          {
            icon: Layers,
            label: "Starting With",
            value: startWith === "mcq" ? "Multiple Choice" : "Theory / Practical",
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        {exam && (
          <div className={`bg-gradient-to-r ${exam.bg} px-8 py-10 text-center`}>
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
              <exam.icon size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{exam.name} Practice</h2>
            <p className="text-white/70 text-sm">Your session is configured and ready</p>
          </div>
        )}
        <div className="p-8">
          <div className="space-y-3 mb-8">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                  <Icon size={15} className="text-green-700" />
                </div>
                <span className="text-[13px] text-gray-500 flex-1">{label}</span>
                <span className="text-[13px] font-bold text-gray-800">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
              <ChevronLeft size={16} /> Adjust
            </button>
            <button
              onClick={onStart}
              disabled={isStarting}
              className="flex-1 py-3 bg-green-800 text-white font-bold text-sm rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0">
              <Zap size={18} /> {isStarting ? "Starting…" : "Start Practice Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
