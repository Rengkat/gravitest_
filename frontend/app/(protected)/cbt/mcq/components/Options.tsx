import { Question } from "@/lib/constants/mcq";
import { SessionMode } from "@/lib/session/practiceSession";
import { CheckCircle2, XCircle, Sparkles } from "lucide-react";
import Image from "next/image";

interface OptionsProps {
  currentQuestion: Question;
  currentSelectedOption: string | null;
  handleSelectOption: (letter: string) => void;
  mode?: SessionMode;
  isRevealed?: boolean;
}

const Options = ({
  currentQuestion,
  currentSelectedOption,
  handleSelectOption,
  mode = "exam",
  isRevealed = false,
}: OptionsProps) => {
  const showReveal = mode === "practice" && isRevealed;
  const options = currentQuestion.options ?? [];

  return (
    <div className="px-6 pb-6 space-y-3" role="radiogroup" aria-label="Answer options">
      {options.map((option) => {
        const letter = option.label;
        const isSelected = currentSelectedOption === letter;
        const isCorrectOption = showReveal && letter === currentQuestion.correctAnswer;
        const isWrongSelected =
          showReveal && isSelected && letter !== currentQuestion.correctAnswer;

        let borderCls = isSelected
          ? "border-green-600 bg-green-50"
          : "border-gray-200 hover:border-green-300 hover:bg-cream/50";
        if (showReveal) {
          if (isCorrectOption) borderCls = "border-green-600 bg-green-50";
          else if (isWrongSelected) borderCls = "border-red-400 bg-red-50";
          else borderCls = "border-gray-200";
        }

        return (
          <label
            key={letter}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all outline-none focus-within:ring-2 focus-within:ring-green-500 ${showReveal ? "cursor-default" : "cursor-pointer"} ${borderCls}`}>
            <input
              type="radio"
              name="question-option"
              value={letter}
              checked={isSelected}
              disabled={showReveal}
              onChange={() => handleSelectOption(letter)}
              className="sr-only"
            />
            <div className="flex items-center gap-3 shrink-0">
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? "border-green-600" : "border-gray-300"
                }`}
                aria-hidden="true">
                {isSelected && <div className="w-3 h-3 rounded-full bg-green-600" />}
              </div>
              <span className="font-bold text-green-800 w-6">{letter}.</span>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[14px] text-gray-700">{option.text}</span>
              {option.imageUrl && (
                <div className="mt-2">
                  <Image
                    src={option.imageUrl}
                    width={280}
                    height={200}
                    alt={`Option ${letter}`}
                    className="max-w-full rounded-lg border border-gray-200 max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
            {isCorrectOption && (
              <CheckCircle2
                size={18}
                className="text-green-600 shrink-0"
                aria-label="Correct answer"
              />
            )}
            {isWrongSelected && (
              <XCircle size={18} className="text-red-500 shrink-0" aria-label="Your answer" />
            )}
          </label>
        );
      })}

      {showReveal && currentQuestion.explanation && (
        <div className="mt-2 p-4 bg-green-50 rounded-xl border border-green-200" role="note">
          <p className="text-[11px] font-bold text-green-800 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
            <Sparkles size={13} />
            Explanation
          </p>
          <p className="text-[13px] text-gray-700 leading-relaxed">{currentQuestion.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default Options;
