import { Answer } from "@/lib/constants/mcq";
import { useMemo } from "react";

export default function QuestionNavigator({
  totalQuestions,
  currentIndex,
  answers,
  onNavigate,
}: {
  totalQuestions: number;
  currentIndex: number;
  answers: Answer[];
  onNavigate: (index: number) => void;
}) {
  const attempted = useMemo(
    () => answers.filter((a) => a.selectedOption !== null).length,
    [answers],
  );

  return (
    <nav
      aria-label="Question Navigator"
      className="bg-white rounded-xl border overflow-hidden"
      style={{ borderColor: "rgba(30,80,50,0.1)" }}>
      <div className="bg-green-800 text-white px-5 py-3">
        <div className="text-[13px] font-semibold">Question Navigator</div>
        <div className="text-[11px] text-white/60 mt-1" aria-live="polite">
          Attempted: {attempted} / {totalQuestions}
        </div>
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto">
        <div className="grid grid-cols-8 gap-1.5" role="list">
          {answers.map((answer, i) => {
            const isAnswered = answer.selectedOption !== null;
            const isCurrent = currentIndex === i;

            let cls =
              "aspect-square w-full min-w-0 rounded-lg text-[12px] font-semibold transition-all hover:scale-105 hover:shadow-sm flex items-center justify-center ";

            if (isCurrent) {
              cls += isAnswered
                ? "border-2 border-green-600 bg-green-800 text-white"
                : "border-2 border-green-600 bg-green-50 text-green-800";
            } else if (isAnswered) {
              cls += "bg-green-800 text-white border border-green-800";
            } else if (answer.isFlagged) {
              cls += "bg-yellow-50 text-yellow-700 border border-yellow-400";
            } else {
              cls += "bg-white text-gray-600 border border-gray-200";
            }

            return (
              <button
                key={i}
                role="listitem"
                onClick={() => onNavigate(i)}
                aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ""}${answer.isFlagged ? ", flagged" : ""}${isCurrent ? ", current" : ""}`}
                aria-current={isCurrent ? "true" : undefined}
                className={cls}>
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-2 text-[11px]">
        {[
          { cls: "bg-green-800", label: "Answered" },
          { cls: "border-2 border-green-600 bg-green-50", label: "Current" },
          { cls: "border border-gray-200 bg-white", label: "Unanswered" },
          { cls: "bg-yellow-50 border border-yellow-400", label: "Flagged" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded shrink-0 ${cls}`} aria-hidden="true" />
            <span className="text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </nav>
  );
}
