import { Question } from "@/lib/constants/mcq";
type Props = {
  currentQuestion: Question;
};
const QuestionText = ({ currentQuestion }: Props) => {
  return (
    <div className="p-6">
      <p className="text-[15px] leading-relaxed text-gray-800">{currentQuestion.text}</p>
      <p className="text-[12px] text-gray-400 mt-3">
        Tip: press <kbd className="bg-gray-100 px-1 rounded">A</kbd>{" "}
        <kbd className="bg-gray-100 px-1 rounded">B</kbd>{" "}
        <kbd className="bg-gray-100 px-1 rounded">C</kbd>{" "}
        <kbd className="bg-gray-100 px-1 rounded">D</kbd> to select, or{" "}
        <kbd className="bg-gray-100 px-1 rounded">← →</kbd> to navigate.
      </p>
    </div>
  );
};

export default QuestionText;
