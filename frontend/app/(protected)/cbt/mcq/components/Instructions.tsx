import { FileText, Play, HelpCircle } from "lucide-react";
import { buildInstructionLines, formatDuration, formatQuestionCount, type ExamSummary } from "@/lib/session/examSummary";
import InstructionList from "../../components/InstructionList";

/**
 * Pre-exam instructions. Everything shown comes from `summary`, which is built
 * from the real session configuration — nothing here is hardcoded.
 */
export default function InstructionsPage({ onStart, summary }: { onStart: () => void; summary: ExamSummary }) {
  const lines = buildInstructionLines(summary);
  const subtitle = [
    summary.subjectsLabel,
    summary.questionCount ? formatQuestionCount(summary.questionCount) : null,
    summary.isTimed ? (summary.durationMinutes ? formatDuration(summary.durationMinutes) : null) : "Untimed",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-green-800 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gold" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-2xl mb-2">{summary.title}</h1>
          <p className="text-white/90">{subtitle}</p>
          <p className="mt-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {summary.kindLabel} · {summary.modeLabel}
          </p>
        </div>
        <div className="p-8">
          <h2 className="font-bold text-green-800 mb-4 flex items-center gap-2">
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
