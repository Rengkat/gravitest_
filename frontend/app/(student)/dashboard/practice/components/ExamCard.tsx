import { SECONDARY_EXAMS } from "@/lib/constants/practice";
import { Check } from "lucide-react";

// Define the type properly
type Exam = (typeof SECONDARY_EXAMS)[0];

// Extend the type to include optional badge property
type ExamWithOptionalBadge = Exam & {
  badge?: string;
};

export default function ExamCard({
  exam,
  selected,
  onClick,
}: {
  exam: ExamWithOptionalBadge;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = exam.icon;

  // Type-safe badge check
  const hasBadge = "badge" in exam && exam.badge;

  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${selected ? "border-green-600 bg-green-50 shadow-lg shadow-green-100" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"}`}>
      {hasBadge && (
        <div className="absolute -top-2.5 left-4">
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-800 text-white tracking-wide">
            {exam.badge}
          </span>
        </div>
      )}
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${exam.bg} flex items-center justify-center shrink-0 shadow-md`}>
          <Icon size={22} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[17px] font-bold text-gray-900">{exam.name}</span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${exam.color}18`, color: exam.color }}>
              {exam.fullName}
            </span>
          </div>
          <p className="text-[12px] text-gray-500 leading-relaxed">{exam.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {exam.questionTypes.map((qt) => (
              <span
                key={qt}
                className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                {qt}
              </span>
            ))}
          </div>
        </div>
        <div
          className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-all ${selected ? "border-green-600 bg-green-600" : "border-gray-300"}`}>
          {selected && <Check size={11} className="text-white" />}
        </div>
      </div>
    </button>
  );
}
