import { Check } from "lucide-react";

export default function StepIndicator({ step }: { step: number }) {
  const steps = [
    { n: 1, label: "Choose Exam" },
    { n: 2, label: "Configure" },
    { n: 3, label: "Start" },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step > s.n ? "bg-green-600 text-white" : step === s.n ? "bg-green-800 text-white ring-4 ring-green-800/20" : "bg-gray-100 text-gray-400"}`}>
              {step > s.n ? <Check size={16} /> : s.n}
            </div>
            <span
              className={`text-[11px] font-semibold whitespace-nowrap ${step >= s.n ? "text-green-800" : "text-gray-400"}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-20 h-0.5 mb-5 mx-1 transition-all duration-500 ${step > s.n ? "bg-green-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
