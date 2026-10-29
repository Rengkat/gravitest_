import { FileText, HelpCircle, Lock, Play } from "lucide-react";
import { buildInstructionLines, formatDuration, formatQuestionCount, type ExamSummary } from "@/lib/session/examSummary";
import InstructionList from "../../components/InstructionList";

interface InstructionsProps {
  onStart: () => void;
  /** Built from the real session configuration — nothing on this screen is hardcoded. */
  summary: ExamSummary;
}

export default function Instructions({ onStart, summary }: InstructionsProps) {
  const lines = buildInstructionLines(summary);
  const subtitle = [
    summary.subjectsLabel ? `${summary.subjectsLabel} (${summary.kindLabel})` : summary.kindLabel,
    summary.questionCount ? formatQuestionCount(summary.questionCount) : null,
    summary.isTimed ? (summary.durationMinutes ? formatDuration(summary.durationMinutes) : null) : "Untimed",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-green-800 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-yellow-300" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl mb-2">{summary.title}</h1>
          <p className="text-white/90">{subtitle}</p>
        </div>
        <div className="p-8">
          {/* The mode was chosen on the practice-selection screen and is fixed for this session. */}
          <div className="mb-6 p-4 rounded-xl border-2 border-green-800 bg-green-50 flex items-center gap-3">
            <Lock size={16} className="text-green-900" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-green-900">{summary.modeLabel}</p>
              <p className="text-xs text-gray-700">
                {summary.mode === "practice"
                  ? "Untimed. Check each part for immediate feedback, the stored explanation and AI help."
                  : "Timed. No answers, feedback or scores until you submit (or time runs out)."}
              </p>
            </div>
          </div>

          <h2 className="font-bold text-green-900 mb-4 flex items-center gap-2">
            <HelpCircle size={18} aria-hidden="true" />
            Instructions
          </h2>
          <InstructionList lines={lines} />
          <button
            onClick={onStart}
            className="w-full py-4 bg-green-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
            <Play size={20} aria-hidden="true" />
            {summary.mode === "practice" ? "Start Practice" : "Start Examination"}
          </button>
        </div>
      </div>
    </div>
  );
}
