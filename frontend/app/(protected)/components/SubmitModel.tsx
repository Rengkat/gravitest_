import React, { Dispatch, SetStateAction } from "react";
import { Send, AlertCircle } from "lucide-react";
import { Answer, ExamMode } from "@/types/examsTypes";

interface SubmitModelProps {
  mode: ExamMode;
  answers: Answer[];
  isAnswered: (answer: Answer) => boolean;
  setShowSubmitModal: Dispatch<SetStateAction<boolean>>;
  confirmSubmit: () => void;
}

const SubmitModel = ({
  mode,
  answers,
  isAnswered,
  setShowSubmitModal,
  confirmSubmit,
}: SubmitModelProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-5">
          <Send size={44} className="mx-auto text-green-600 mb-3" />
          <h3 className="text-xl font-bold text-green-900 mb-2">
            Submit {mode === "practice" ? "Practice" : "Exam"}?
          </h3>
          <p className="text-gray-500 text-sm">
            You have answered <strong>{answers.filter(isAnswered).length}</strong> of{" "}
            <strong>{answers.length}</strong> sub-questions.
          </p>
          {answers.filter(isAnswered).length < answers.length && (
            <p className="text-yellow-600 text-sm mt-2 flex items-center justify-center gap-1.5">
              <AlertCircle size={14} />
              Some sub-questions are unanswered.
            </p>
          )}
          {mode === "exam" && (
            <p className="text-blue-600 text-sm mt-2">
              Model answers will be revealed after submission.
            </p>
          )}
          {mode === "practice" && (
            <p className="text-green-700 text-sm mt-2">
              You can score any sub-question with AI after submitting.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSubmitModal(false)}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-colors text-sm">
            Cancel
          </button>
          <button
            onClick={confirmSubmit}
            className="flex-1 px-4 py-2.5 rounded-lg bg-green-800 text-white font-semibold hover:bg-green-700 transition-colors text-sm">
            Submit Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModel;
