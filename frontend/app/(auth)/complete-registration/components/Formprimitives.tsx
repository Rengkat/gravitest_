"use client";

import { type FieldError } from "react-hook-form";
import { AlertCircle } from "lucide-react";

// ─── SHARED INPUT CLASS ──────────────────────────────────────
export const inputCls = (error?: FieldError) =>
  `w-full px-4 py-2.5 rounded-xl border text-[14px] focus:outline-none focus:ring-2 transition-all ${
    error
      ? "border-red-300 focus:ring-red-500/20 focus:border-red-400 bg-red-50/30"
      : "border-gray-200 focus:border-green-400 focus:ring-green-500/20"
  }`;

// ─── FIELD WRAPPER ───────────────────────────────────────────
export function FieldWrapper({
  label,
  required,
  children,
  error,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: FieldError;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-green-900 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-text-muted mt-1">{hint}</p>}
      {error && <ErrorMessage message={error.message ?? "Invalid value"} />}
    </div>
  );
}

// ─── ERROR MESSAGE ───────────────────────────────────────────
export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle size={11} className="shrink-0" />
      {message}
    </p>
  );
}

// ─── SECTION HEADER ──────────────────────────────────────────
export function SectionHeader({
  icon: Icon,
  title,
  description,
  color = "#2e8b57",
}: {
  icon: any;
  title: string;
  description: string;
  color?: string;
}) {
  return (
    <div
      className="flex items-start gap-3 mb-6 p-4 rounded-2xl"
      style={{ background: `${color}08` }}>
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}15` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <h2 className="font-serif text-lg text-green-900">{title}</h2>
        <p className="text-[13px] text-text-muted">{description}</p>
      </div>
    </div>
  );
}

// ─── MULTI-SELECT CHIP GROUP ─────────────────────────────────
/**
 * Renders a group of toggle chips.
 * value / onChange compatible with react-hook-form Controller.
 */
export function ChipGroup({
  options,
  value,
  onChange,
  max,
  error,
}: {
  options: { id: string; label: string; description?: string; color?: string }[];
  value: string[];
  onChange: (val: string[]) => void;
  max?: number;
  error?: FieldError;
}) {
  const toggle = (id: string) => {
    const current = value ?? [];
    if (current.includes(id)) {
      onChange(current.filter((v) => v !== id));
    } else if (!max || current.length < max) {
      onChange([...current, id]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = (value ?? []).includes(opt.id);
          const color = opt.color ?? "#2e8b57";
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`px-3 py-2 rounded-xl border-2 text-[12px] font-semibold transition-all ${
                selected
                  ? "text-white shadow-md"
                  : "bg-white text-text-muted hover:border-opacity-50"
              }`}
              style={
                selected
                  ? { borderColor: color, background: color }
                  : { borderColor: "rgba(0,0,0,0.1)" }
              }>
              {opt.label}
            </button>
          );
        })}
      </div>
      {max && (value?.length ?? 0) > 0 && (
        <p className="text-[11px] text-text-muted mt-2">
          {value.length}/{max} selected
        </p>
      )}
      {error && <ErrorMessage message={error.message ?? "Invalid selection"} />}
    </div>
  );
}

// ─── SUBJECT CHIP GRID ───────────────────────────────────────
export function SubjectChipGrid({
  subjects,
  value,
  onChange,
  max,
  error,
}: {
  subjects: readonly string[];
  value: string[];
  onChange: (val: string[]) => void;
  max?: number;
  error?: FieldError;
}) {
  const toggle = (s: string) => {
    if (value.includes(s)) {
      onChange(value.filter((v) => v !== s));
    } else if (!max || value.length < max) {
      onChange([...value, s]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {subjects.map((s) => {
          const selected = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all ${
                selected
                  ? "bg-green-800 text-white border-green-800"
                  : "bg-white text-text-muted border-gray-200 hover:border-green-400 hover:text-green-800"
              }`}>
              {s}
            </button>
          );
        })}
      </div>
      {max && value.length > 0 && (
        <p className="text-[11px] text-text-muted mt-2">
          {value.length}/{max} selected
        </p>
      )}
      {error && <ErrorMessage message={error.message ?? "Select at least one subject"} />}
    </div>
  );
}
