import { Settings, Hash, Clock } from "lucide-react";
import { QUESTION_COUNTS, DEFAULT_TIME } from "../constants";

const PRESETS = [5, 10, 20, 30, 40, 50, 60];
const MAX_QUESTIONS = 200; // backend limit per session

interface CountPickerProps {
  label: string;
  value?: number;
  // How many questions really exist for the current selection.
  // null = still loading / unknown (never treated as zero).
  availableCount: number | null;
  loading: boolean;
  // Theory / practical: one "question" is a full exam question with all its parts
  isLongForm: boolean;
  maxAllowed?: number;
  onChange: (n: number | undefined) => void;
}

function CountPicker({
  label,
  value,
  availableCount,
  loading,
  isLongForm,
  maxAllowed = MAX_QUESTIONS,
  onChange,
}: CountPickerProps) {
  const cap = availableCount === null ? maxAllowed : Math.min(availableCount, maxAllowed);
  const none = availableCount === 0;
  // Presets that fit, plus an "All" chip so the student can take everything available
  const presets = PRESETS.filter((n) => n < cap);
  const showAll = availableCount !== null && availableCount > 0;

  const chip = (active: boolean) =>
    `h-11 px-4 min-w-14 rounded-xl text-[13px] font-bold transition-all ${
      active ? "bg-purple-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Hash size={14} className="text-gray-400" />
        <span className="text-[13px] font-semibold text-gray-700">{label}</span>
        <span className="text-[11px] text-gray-400">
          {loading
            ? "Checking availability…"
            : availableCount === null
              ? ""
              : `${availableCount} available`}
        </span>
      </div>

      {none ? (
        <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          No questions are available for this selection yet. Try a different year, subject or
          question type.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {presets.map((n) => (
              <button key={n} type="button" onClick={() => onChange(n)} className={chip(value === n)}>
                {n}
              </button>
            ))}
            {showAll && (
              <button type="button" onClick={() => onChange(cap)} className={chip(value === cap)}>
                {cap === 1 ? "1" : `All (${cap})`}
              </button>
            )}
            <input
              type="number"
              placeholder="Custom"
              aria-label={`Custom number — ${label}`}
              min={1}
              max={cap}
              className="w-20 h-11 px-3 rounded-xl border border-gray-200 text-[13px] font-semibold text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
              onChange={(e) => {
                const n = parseInt(e.target.value);
                onChange(Number.isNaN(n) ? undefined : Math.min(Math.max(n, 1), cap));
              }}
            />
          </div>
          {isLongForm && (
            <p className="text-[11px] text-gray-400 mt-2">
              Each question comes with all its parts — (a), (b), (i), (ii) and so on.
            </p>
          )}
        </>
      )}
    </div>
  );
}

interface McqSettingsSectionProps {
  numQuestions?: number;
  timeLimit?: number;
  availableCount: number | null;
  loadingCount: boolean;
  // Single-type session with theory/practical questions
  isLongForm: boolean;
  // Mixed (MCQ + theory) session: shows a second picker for the theory part
  theory?: {
    value?: number;
    availableCount: number | null;
    loading: boolean;
    onChange: (n: number | undefined) => void;
  };
  onChangeNumQuestions: (n: number | undefined) => void;
  onChangeTimeLimit: (n: number) => void;
}

export default function McqSettingsSection({
  numQuestions,
  timeLimit,
  availableCount,
  loadingCount,
  isLongForm,
  theory,
  onChangeNumQuestions,
  onChangeTimeLimit,
}: McqSettingsSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Settings size={16} className="text-purple-600" />
        </div>
        <div>
          <h3 className="text-[15px] font-bold text-gray-800">Session Settings</h3>
          <p className="text-[11px] text-gray-400">Number of questions and time limit</p>
        </div>
      </div>
      <div className="space-y-5">
        <CountPicker
          label={theory ? "Objective (MCQ) questions" : "Number of Questions"}
          value={numQuestions}
          availableCount={availableCount}
          loading={loadingCount}
          isLongForm={isLongForm}
          onChange={onChangeNumQuestions}
        />
        {theory && (
          <CountPicker
            label="Theory questions"
            value={theory.value}
            availableCount={theory.availableCount}
            loading={theory.loading}
            isLongForm
            maxAllowed={50}
            onChange={theory.onChange}
          />
        )}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-gray-400" />
            <span className="text-[13px] font-semibold text-gray-700">Time Limit</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-4 py-2.5 flex-1">
              <input
                title="time"
                type="number"
                value={timeLimit || DEFAULT_TIME}
                min={5}
                max={300}
                onChange={(e) => onChangeTimeLimit(parseInt(e.target.value) || DEFAULT_TIME)}
                className="w-16 bg-transparent text-[15px] font-bold text-gray-800 focus:outline-none text-center"
              />
              <span className="text-[13px] text-gray-500 font-medium">minutes</span>
            </div>
            <button
              onClick={() => onChangeTimeLimit(DEFAULT_TIME)}
              className="text-[12px] text-green-700 hover:text-green-800 font-semibold px-3 py-2.5 rounded-xl hover:bg-green-50 transition-all whitespace-nowrap">
              Reset to {DEFAULT_TIME}m
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
