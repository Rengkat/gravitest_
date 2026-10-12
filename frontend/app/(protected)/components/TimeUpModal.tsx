import { Answer } from "@/types/examsTypes";
import { Clock, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

interface TimeUpModalProps {
  answers: Answer[];
  isAnswered: (answer: Answer) => boolean;
  setShowTimeUpModal: Dispatch<SetStateAction<boolean>>;
  sessionId: string;
}

const TimeUpModal = ({ answers, isAnswered, setShowTimeUpModal, sessionId }: TimeUpModalProps) => {
  const router = useRouter();
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true">
      <div className="bg-white rounded-2xl max-w-sm w-full mx-4 overflow-hidden shadow-2xl">
        <div className="bg-red-600 p-6 text-center text-white">
          <Clock size={48} className="mx-auto mb-3 animate-pulse" />
          <h2 className="text-2xl font-bold mb-1">Time&apos;s Up!</h2>
          <p className="text-red-100 text-sm">Your exam has been automatically submitted.</p>
        </div>
        <div className="p-6 text-center">
          <p className="text-gray-600 text-sm mb-2">
            You answered{" "}
            <strong className="text-green-800">{answers.filter(isAnswered).length}</strong> of{" "}
            <strong>{answers.length}</strong> sub-questions.
          </p>
          <p className="text-gray-400 text-xs mb-6">Your work has been saved and submitted.</p>
          <button
            onClick={() => {
              setShowTimeUpModal(false);
              router.push(`/dashboard/practice/session/${sessionId}/results`);
            }}
            className="w-full py-3 bg-green-800 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2">
            <Send size={16} />
            View Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeUpModal;
