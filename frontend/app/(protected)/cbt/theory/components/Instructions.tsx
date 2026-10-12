import { ExamMode } from "@/types/examsTypes";
import { FileText, HelpCircle, Lock, Play } from "lucide-react";
import { useState } from "react";

interface InstructionsProps {
  onStart: (mode: ExamMode) => void;
  mode?: ExamMode;
  /** True when the mode was already chosen on the practice-selection screen */
  modeLocked?: boolean;
}

export default function Instructions({ onStart, mode, modeLocked }: InstructionsProps) {
  const [selectedMode, setSelectedMode] = useState<ExamMode>(mode || "practice");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-green-800 text-white p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-yellow-300" />
          </div>
          <h1 className="font-serif text-2xl mb-2">JAMB UTME CBT Examination</h1>
          <p className="text-white/70">Physics (Essay) · 2 Questions · 2 Hours 30 Mins</p>
        </div>
        <div className="p-8">
          {/* Mode selector */}
          <div className="mb-6">
            <p className="text-sm font-bold text-gray-700 mb-3">
              {modeLocked ? "Session type (set during selection):" : "Select session type:"}
            </p>
            {modeLocked ? (
              <div className="p-4 rounded-xl border-2 border-green-800 bg-green-50 flex items-center gap-3">
                <Lock size={16} className="text-green-800" />
                <div>
                  <p className="text-sm font-bold text-green-800">
                    {selectedMode === "practice" ? "Practice Mode" : "Exam Mode"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedMode === "practice"
                      ? "Get AI scoring and model answers as soon as you answer each sub-question."
                      : "Model answers shown after submission only."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    [
                      "practice",
                      "Practice Mode",
                      "Get AI scoring and model answers after each sub-question.",
                    ],
                    [
                      "exam",
                      "Exam Mode",
                      "Timed exam — model answers shown after submission only.",
                    ],
                  ] as const
                ).map(([m, title, desc]) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMode(m)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${selectedMode === m ? "border-green-800 bg-green-50" : "border-gray-200 hover:border-green-400"}`}>
                    <p
                      className={`text-sm font-bold mb-1 ${selectedMode === m ? "text-green-800" : "text-gray-700"}`}>
                      {title}
                    </p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <h2 className="font-bold text-green-800 mb-4 flex items-center gap-2">
            <HelpCircle size={18} />
            Instructions
          </h2>
          <div className="space-y-3 mb-8">
            {[
              <>
                <strong>Answer ALL questions.</strong> Each question has sub-parts (a, b, c…).
              </>,
              <>
                You can <strong>type</strong>, use the <strong>whiteboard</strong>,{" "}
                <strong>graph sheet</strong>, <strong>construction sheet</strong>, or{" "}
                <strong>upload</strong> handwritten work.
              </>,
              selectedMode === "practice" ? (
                <>
                  In <strong>Practice Mode</strong>, click <em>{"Score with AI"}</em> on any
                  sub-question after answering to get instant feedback and the model answer.
                </>
              ) : (
                <>
                  In <strong>Exam Mode</strong>, model answers are revealed after you submit the
                  full paper.
                </>
              ),
              <>
                Answers are <strong>auto-saved</strong> as you work.
              </>,
              <>
                <strong className="text-red-600">Auto-submits</strong> when the timer reaches zero.
              </>,
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-text-muted text-sm">{item}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => onStart(selectedMode)}
            className="w-full py-4 bg-green-800 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-green-700 transition-all">
            <Play size={20} />
            Start {selectedMode === "practice" ? "Practice" : "Examination"}
          </button>
        </div>
      </div>
    </div>
  );
}
