import { ListChecks, CircleDot, PenLine, Microscope, Layers } from "lucide-react";
import { QuestionType } from "@/types/practice";
import { CbtPart } from "@/lib/session/practiceSession";

interface QuestionTypeSectionProps {
  questionType?: QuestionType;
  theoryAvailable: boolean;
  startWith: CbtPart;
  onChangeType: (id: QuestionType) => void;
  onChangeStartWith: (id: CbtPart) => void;
}

const QUESTION_TYPES: {
  id: QuestionType;
  label: string;
  desc: string;
  icon: typeof CircleDot;
  color: string;
  activeBg: string;
}[] = [
  {
    id: "MCQ",
    label: "Multiple Choice",
    desc: "Pick the best answer",
    icon: CircleDot,
    color: "text-blue-500",
    activeBg: "border-blue-500 bg-blue-50",
  },
  {
    id: "THEORY",
    label: "Theory",
    desc: "Written explanations",
    icon: PenLine,
    color: "text-violet-500",
    activeBg: "border-violet-500 bg-violet-50",
  },
  {
    id: "PRACTICAL",
    label: "Practical",
    desc: "Hands-on questions",
    icon: Microscope,
    color: "text-teal-500",
    activeBg: "border-teal-500 bg-teal-50",
  },
  {
    id: "ALL",
    label: "Mixed",
    desc: "All types combined",
    icon: Layers,
    color: "text-orange-500",
    activeBg: "border-orange-500 bg-orange-50",
  },
];

const START_WITH_OPTIONS: { id: CbtPart; label: string; icon: typeof CircleDot }[] = [
  { id: "mcq", label: "Multiple Choice", icon: CircleDot },
  { id: "theory", label: "Theory / Practical", icon: PenLine },
];

export default function QuestionTypeSection({
  questionType,
  theoryAvailable,
  startWith,
  onChangeType,
  onChangeStartWith,
}: QuestionTypeSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <ListChecks size={16} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Question Type</h3>
          <p className="text-[11px] text-gray-400">How do you want to be tested?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUESTION_TYPES.map((qt) => {
          const Icon = qt.icon;
          const active = questionType === qt.id;
          const needsTheory = qt.id === "THEORY" || qt.id === "PRACTICAL" || qt.id === "ALL";
          const disabled = needsTheory && !theoryAvailable;
          return (
            <button
              key={qt.id}
              disabled={disabled}
              title={
                disabled
                  ? "Theory/Practical questions aren't available for this subject yet"
                  : undefined
              }
              onClick={() => !disabled && onChangeType(qt.id)}
              className={`p-3.5 rounded-xl text-left transition-all duration-150 border-2 ${disabled ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed" : active ? qt.activeBg : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
              <Icon
                size={20}
                className={`mb-2 ${active && !disabled ? qt.color : "text-gray-400"}`}
              />
              <div className="text-[13px] font-semibold text-gray-800">{qt.label}</div>
              <div className="text-[11px] text-gray-400 mt-0.5">{qt.desc}</div>
            </button>
          );
        })}
      </div>

      {!theoryAvailable && (
        <p className="text-[11px] text-amber-600 mt-4 flex items-center gap-1.5">
          <PenLine size={12} />
          This subject only has multiple-choice questions in our bank right now.
        </p>
      )}

      {questionType === "ALL" && theoryAvailable && (
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-[12px] font-semibold text-gray-700 mb-3">
            Start with which part first?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {START_WITH_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = startWith === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChangeStartWith(opt.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl text-left border-2 transition-all ${active ? "border-green-600 bg-green-50" : "border-gray-100 bg-gray-50 hover:border-gray-200"}`}>
                  <Icon size={16} className={active ? "text-green-700" : "text-gray-400"} />
                  <span className="text-[12px] font-semibold text-gray-800">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            You'll move straight into the other part right after finishing this one.
          </p>
        </div>
      )}
    </div>
  );
}
