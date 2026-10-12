import { CalendarDays, Shuffle } from "lucide-react";
import { YEARS } from "../constants";

interface YearSectionProps {
  year?: string;
  onChange: (year: string | undefined) => void;
}

export default function YearSection({ year, onChange }: YearSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <CalendarDays size={16} className="text-amber-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Exam Year</h3>
          <p className="text-[11px] text-gray-400">Optional — random mix if not selected</p>
        </div>
        {year && (
          <button
            onClick={() => onChange(undefined)}
            className="ml-auto text-[11px] text-gray-400 hover:text-red-500 transition-colors">
            Clear ✕
          </button>
        )}
      </div>
      {/* Bounded + scrollable rather than an unbounded flex-wrap — the
          year list only grows over time (a new past-question year is
          added every year), so without a cap this section would keep
          taking up more and more of the page indefinitely. */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={() => onChange(undefined)}
          className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5 ${!year ? "bg-green-800 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          <Shuffle size={13} /> Random
        </button>
      </div>
      <div className="max-h-40 overflow-y-auto rounded-xl border border-gray-100 p-2">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {YEARS.map((yr) => (
            <button
              key={yr}
              onClick={() => onChange(yr)}
              className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-all ${year === yr ? "bg-green-800 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {yr}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
