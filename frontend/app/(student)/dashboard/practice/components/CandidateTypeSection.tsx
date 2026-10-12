"use client";

import { CANDIDATE_TYPE_OPTIONS } from "@/lib/constants/practice";
import type { CandidateType } from "@/types/practice";

interface Props {
  value?: CandidateType;
  onChange: (value: CandidateType | undefined) => void;
}

// Shown only for exams in CANDIDATE_TYPE_EXAMS (WAEC, NECO, NABTEB, BECE,
// Junior NECO) — these are the exam bodies that actually register
// candidates as either school (internal) or private (external). Leaving
// this unset ("Both") pulls questions from either stream, which is safe
// since most past questions apply to both anyway.
export default function CandidateTypeSection({ value, onChange }: Props) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-2">Candidate Type</h3>
      <p className="text-xs text-gray-500 mb-3">
        Are you registering as a school or private candidate? Leave unselected to practice with
        questions for both.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className={`text-left p-3 rounded-xl border transition-all ${
            !value
              ? "border-green-600 bg-green-50 ring-1 ring-green-600"
              : "border-gray-200 hover:border-gray-300"
          }`}>
          <p className="text-sm font-medium text-gray-800">Both / Not sure</p>
          <p className="text-xs text-gray-500 mt-0.5">Include questions for either stream.</p>
        </button>
        {CANDIDATE_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`text-left p-3 rounded-xl border transition-all ${
              value === opt.id
                ? "border-green-600 bg-green-50 ring-1 ring-green-600"
                : "border-gray-200 hover:border-gray-300"
            }`}>
            <p className="text-sm font-medium text-gray-800">{opt.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
