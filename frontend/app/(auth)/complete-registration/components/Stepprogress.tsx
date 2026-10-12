"use client";

import { CheckCircle } from "lucide-react";
import { REGISTRATION_STEPS, type StepNumber } from "../constants";

interface Props {
  currentStep: StepNumber;
}

export function StepProgress({ currentStep }: Props) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between relative">
        {/* Connector track behind the icons */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-0 h-0.5 bg-green-500 z-0 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (REGISTRATION_STEPS.length - 1)) * 100}%` }}
        />

        {REGISTRATION_STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <div key={step.number} className="flex-1 flex flex-col items-center relative z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? "border-green-500 bg-green-500 text-white shadow-md"
                    : isActive
                      ? "border-green-700 bg-green-700 text-white shadow-lg shadow-green-200"
                      : "border-gray-300 bg-white text-gray-400"
                }`}>
                {isCompleted ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span
                className={`text-[11px] font-semibold mt-2 text-center transition-colors ${
                  isActive ? "text-green-800" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step counter */}
      <p className="text-center text-[12px] text-text-muted mt-4">
        Step <span className="font-semibold text-green-900">{currentStep}</span> of{" "}
        <span className="font-semibold text-green-900">{REGISTRATION_STEPS.length}</span>
      </p>
    </div>
  );
}
