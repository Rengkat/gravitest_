import { CheckCircle, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
import QuestionText from "./QuestionText";
import Options from "./Options";
import PassagePanel from "../../../components/PassagePanel";
import { Question } from "@/lib/constants/mcq";
import { SessionMode } from "@/lib/session/practiceSession";

interface LeftQuestionProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: Question;
  currentSelectedOption: string | null;
  isSpeaking: boolean;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSelectOption: (letter: string) => void;
  handleReadAloud: () => void;
  /** Practice vs exam — controls whether the answer can be revealed mid-session */
  mode?: SessionMode;
  /** Practice mode: has this question's correct answer already been revealed */
  isRevealed?: boolean;
}

const LeftQuestion = ({
  currentQuestionIndex,
  handleNext,
  handlePrevious,
  currentSelectedOption,
  handleSelectOption,
  currentQuestion,
  totalQuestions,
  handleReadAloud,
  isSpeaking,
  mode = "exam",
  isRevealed = false,
}: LeftQuestionProps) => {
  return (
    <div className="lg:col-span-2">
      <div
        className="bg-white rounded-xl border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.1)" }}
        role="region"
        aria-label={`Question ${currentQuestionIndex + 1} of ${totalQuestions}`}>
        {/* Question header */}
        <div className="border-b p-5 flex items-center gap-3 flex-wrap">
          <CheckCircle size={20} className="text-green-600" aria-hidden="true" />
          <span className="text-[15px] font-bold text-green-800">Question</span>
          <span className="font-mono font-bold text-green-800">
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
          <button
            onClick={handleReadAloud}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              isSpeaking ? "bg-green-100 text-green-800" : "hover:bg-cream"
            }`}
            aria-label={isSpeaking ? "Stop reading aloud" : "Read question aloud"}>
            {isSpeaking ? (
              <VolumeX size={16} aria-hidden="true" />
            ) : (
              <Volume2 size={16} aria-hidden="true" />
            )}
            <span className="text-[12px]">{isSpeaking ? "Stop" : "Read Aloud"}</span>
          </button>
        </div>

        {/* Diagram — legacy inline SVG (mock data only, kept for safety) */}
        {currentQuestion.hasDiagram && currentQuestion.diagramSvg && (
          <div
            data-testid="diagram-container"
            className="border-b p-6 flex justify-center bg-cream/30"
            aria-hidden="true">
            <div dangerouslySetInnerHTML={{ __html: currentQuestion.diagramSvg }} />
          </div>
        )}

        {/* Real question image, e.g. a diagram/chart uploaded with the question */}
        {currentQuestion.questionImageUrl && (
          <div
            data-testid="question-image-container"
            className="border-b p-6 flex justify-center bg-cream/30">
            <Image
              src={currentQuestion.questionImageUrl}
              width={600}
              height={400}
              alt="Question diagram"
              className="max-w-full rounded-lg border border-gray-200 max-h-80 object-contain"
            />
          </div>
        )}

        {/* Comprehension passage this question belongs to, if any */}
        <PassagePanel passage={currentQuestion.passage} />

        {/* Question text */}
        <QuestionText currentQuestion={currentQuestion} />

        {/* Options */}
        <Options
          currentQuestion={currentQuestion}
          currentSelectedOption={currentSelectedOption}
          handleSelectOption={handleSelectOption}
          mode={mode}
          isRevealed={isRevealed}
        />

        {/* Navigation buttons */}
        <div className="border-t p-5 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            aria-label="Go to previous question"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold bg-gold text-green-900 hover:bg-gold-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <ChevronLeft size={16} aria-hidden="true" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === totalQuestions - 1}
            aria-label="Go to next question"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold bg-green-800 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            Next
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeftQuestion;
