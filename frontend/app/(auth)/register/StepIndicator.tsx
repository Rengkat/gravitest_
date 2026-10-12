import { Check } from "lucide-react";

type Step = 1 | 2 | 3;

const LABELS: Record<Step, string> = {
  1: "Account Type",
  2: "Your Details",
  3: "Verify",
};

export default function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {([1, 2, 3] as Step[]).map((step, i) => {
        const isDone   = step < current;
        const isActive = step === current;

        return (
          <div key={step} className="flex items-center flex-1">
            {/* Circle + label */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${isDone   ? "bg-green-500 border-green-500 text-white" : ""}
                  ${isActive ? "bg-green-800 border-green-800 text-white" : ""}
                  ${!isDone && !isActive ? "border-green-900/20 text-green-900/40" : ""}
                `}
              >
                {isDone ? <Check size={14} strokeWidth={2.5} /> : step}
              </div>
              <span
                className={`text-[10px] font-semibold mt-1.5 tracking-wide uppercase
                  ${isActive || isDone ? "text-green-800" : "text-green-900/40"}
                `}
              >
                {LABELS[step]}
              </span>
            </div>

            {/* Connector (not after last step) */}
            {i < 2 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-4 transition-all duration-500
                  ${step < current ? "bg-green-500" : "bg-green-900/10"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
