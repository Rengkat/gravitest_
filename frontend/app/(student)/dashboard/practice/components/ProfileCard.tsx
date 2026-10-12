import { PROFESSIONAL_EXAMS } from "@/lib/constants/practice";
import { Check } from "lucide-react";

export default function ProfCard({
  exam,
  selected,
  onClick,
}: {
  exam: (typeof PROFESSIONAL_EXAMS)[0];
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = exam.icon;
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${selected ? "border-green-600 bg-green-50 shadow-lg shadow-green-100" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"}`}>
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-11 h-11 rounded-xl bg-gradient-to-br ${exam.bg} flex items-center justify-center shadow-md`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-gray-900">{exam.name}</div>
          <div className="text-[10px] font-semibold" style={{ color: exam.color }}>
            {exam.field}
          </div>
        </div>
        <div
          className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected ? "border-green-600 bg-green-600" : "border-gray-300"}`}>
          {selected && <Check size={11} className="text-white" />}
        </div>
      </div>
      <p className="text-[12px] text-gray-500 mb-3">{exam.description}</p>
      <div className="flex gap-1.5">
        {exam.levels.map((l) => (
          <span
            key={l}
            className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
            {l}
          </span>
        ))}
      </div>
    </button>
  );
}
