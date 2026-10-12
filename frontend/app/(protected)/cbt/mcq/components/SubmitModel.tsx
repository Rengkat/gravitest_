import { AlertCircle, Send } from "lucide-react";
import React from "react";

interface SubmitModelProps {
  totalAnswered: number;
  totalQuestions: number;
  setShowSubmitModal: React.Dispatch<React.SetStateAction<boolean>>;
  confirmSubmit: () => void;
}

const SubmitModel = ({
  totalAnswered,
  totalQuestions,
  setShowSubmitModal,
  confirmSubmit,
}: SubmitModelProps) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-title">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-4">
          <Send size={48} className="mx-auto text-green-600 mb-3" aria-hidden="true" />
          <h3 id="submit-title" className="text-xl font-bold text-green-900 mb-2">
            Submit Exam?
          </h3>
          <p className="text-text-muted text-sm">
            You have answered {totalAnswered} out of {totalQuestions} questions.
          </p>
          {totalAnswered < totalQuestions && (
            <p className="text-yellow-600 text-sm mt-2 flex items-center justify-center gap-1">
              <AlertCircle size={14} aria-hidden="true" />
              You have {totalQuestions - totalAnswered} unanswered question
              {totalQuestions - totalAnswered !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSubmitModal(false)}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={confirmSubmit}
            className="flex-1 px-4 py-2.5 rounded-lg bg-green-800 text-white font-semibold hover:bg-green-700 transition-colors">
            Submit Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModel;
