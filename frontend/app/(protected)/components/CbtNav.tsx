import { formatTime } from "@/utils/formartTimer";
import { AlertCircle, Calculator, Clock, Flag, LogOut } from "lucide-react";
import Link from "next/link";
import React from "react";

interface CbtNavProps {
  setShowCalculator: React.Dispatch<React.SetStateAction<boolean>>;
  handleFlagQuestion: () => void;
  isCurrentFlagged: boolean;
  isLowTime: boolean;
  timeRemaining: number;
}

const CbtNav = ({
  setShowCalculator,
  handleFlagQuestion,
  isCurrentFlagged,
  isLowTime,
  timeRemaining,
}: CbtNavProps) => {
  return (
    <nav className="bg-green-800 text-white sticky top-0 z-50 shadow-lg" aria-label="Exam toolbar">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Exit exam">
            <LogOut size={16} aria-hidden="true" />
            <span className="text-[13px] font-medium">Exit</span>
          </Link>

          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open calculator">
            <Calculator size={16} aria-hidden="true" />
            <span className="text-[13px] font-medium">Calc</span>
          </button>
          <button
            title="flag question for review"
            onClick={handleFlagQuestion}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              isCurrentFlagged ? "bg-yellow-500/20 text-yellow-300" : "hover:bg-white/10"
            }`}
            aria-label={isCurrentFlagged ? "Unflag question" : "Flag question for review"}>
            <Flag size={16} aria-hidden="true" />
            <span className="text-[13px] font-medium">Flag</span>
          </button>

          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Report an issue with this question">
            <AlertCircle size={16} aria-hidden="true" />
            <span className="text-[13px] font-medium">Report</span>
          </button>
        </div>

        {/* Timer */}
        <div
          className={`px-4 py-1.5 rounded-lg font-mono font-bold text-[15px] flex items-center gap-2 ${
            isLowTime ? "bg-red-500 text-white" : "bg-gold text-green-900"
          }`}
          aria-live="polite"
          aria-label={`Time remaining: ${formatTime(timeRemaining)}`}>
          <Clock size={16} aria-hidden="true" />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>
    </nav>
  );
};

export default CbtNav;
