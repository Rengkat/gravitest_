import { PROFESSIONAL_EXAMS, SECONDARY_EXAMS, CANDIDATE_TYPE_OPTIONS } from "@/lib/constants/practice";
import { PracticeConfig, CANDIDATE_TYPE_EXAMS } from "@/types/practice";
import { ArrowRight } from "lucide-react";

export default function SummaryPanel({
  config,
  topics,
  onNext,
  isReady,
}: {
  config: PracticeConfig;
  topics: string[];
  onNext: () => void;
  isReady: boolean;
}) {
  const DEFAULT_TIME = 60;

  const exam =
    config.examType === "PROFESSIONAL"
      ? PROFESSIONAL_EXAMS.find((e) => e.id === config.professionalExam)
      : SECONDARY_EXAMS.find((e) => e.id === config.examType);

  const rows = [
    {
      label: "Exam",
      value: config.examType === "PROFESSIONAL" ? config.professionalExam : config.examType,
    },
    { label: "Year", value: config.year || "Random" },
    ...(config.examType && CANDIDATE_TYPE_EXAMS.includes(config.examType)
      ? [
          {
            label: "Candidate Type",
            value:
              CANDIDATE_TYPE_OPTIONS.find((o) => o.id === config.candidateType)?.label ?? "Both",
          },
        ]
      : []),
    {
      label: "Subject(s)",
      value: config.subjects?.length
        ? config.subjects.length === 1
          ? config.subjects[0]
          : `${config.subjects.length} subjects`
        : config.subject || "—",
    },
    { label: "Type", value: config.questionType || "MCQ" },
    {
      label: "Questions",
      value:
        config.questionType === "ALL" && config.numTheoryQuestions
          ? `${config.numQuestions || 40} MCQ + ${config.numTheoryQuestions} theory`
          : config.numQuestions
            ? `${config.numQuestions}`
            : "40",
    },
    { label: "Time", value: `${config.timeLimit || DEFAULT_TIME} min` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6">
      {exam && (
        <div className={`bg-gradient-to-r ${exam.bg} p-5`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <exam.icon size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white font-bold">{exam.name}</div>
              <div className="text-white/70 text-[11px]">Practice Session</div>
            </div>
          </div>
        </div>
      )}
      <div className="p-5">
        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Session Summary
        </div>
        <div className="space-y-2.5 mb-5">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-[12px] text-gray-500">{label}</span>
              <span
                className={`text-[12px] font-semibold ${value === "—" ? "text-gray-300" : "text-gray-800"}`}>
                {value}
              </span>
            </div>
          ))}
          {topics.length > 0 && (
            <div>
              <div className="text-[12px] text-gray-500 mb-1.5">Topics</div>
              <div className="flex flex-wrap gap-1">
                {topics.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    {t}
                  </span>
                ))}
                {topics.length > 4 && (
                  <span className="text-[10px] text-gray-400">+{topics.length - 4} more</span>
                )}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={!isReady}
          className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${isReady ? "bg-green-800 text-white hover:bg-green-700 shadow-md hover:shadow-lg" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
          {isReady ? (
            <>
              <span>Review &amp; Start</span>
              <ArrowRight size={16} />
            </>
          ) : (
            "Select subject to continue"
          )}
        </button>
        {!isReady && (
          <p className="text-[11px] text-center text-gray-400 mt-2">Pick a subject first</p>
        )}
      </div>
    </div>
  );
}
