"use client";

import { ReactNode } from "react";
import { Check } from "lucide-react";

// ── Section wrapper ───────────────────────────────────────────────────────

export function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
        {description && <p className="text-[12px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
      {footer && <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">{footer}</div>}
    </div>
  );
}

// ── Row for a setting with a toggle ──────────────────────────────────────

export function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon,
  iconBg = "bg-gray-100",
  iconColor = "text-gray-500",
  disabled = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 ${disabled ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-gray-800">{label}</p>
          {description && (
            <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => !disabled && onChange(!value)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 shrink-0 ${
          value ? "bg-green-600" : "bg-gray-200"
        } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        aria-label={label}>
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-[#fff] shadow-sm transition-transform ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ── Chip selector ─────────────────────────────────────────────────────────

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-xl text-[13px] font-semibold border transition-all ${
            value === opt
              ? "bg-green-600 text-white border-green-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-700"
          }`}>
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  );
}

// ── Select input ──────────────────────────────────────────────────────────

export function SettingsSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { id: T; label: string }[];
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <select
        title="hint"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[14px] bg-white focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-500/20 transition-all">
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// ── Range slider ──────────────────────────────────────────────────────────

export function SettingsRange({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[12px] font-bold text-gray-600 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[13px] font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        title="value"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-green-600"
      />
      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────

export function SettingsGroupLabel({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 mt-1">
      {label}
    </p>
  );
}

// ── Save bar ──────────────────────────────────────────────────────────────

export function SaveBar({
  visible,
  onSave,
  onDiscard,
  isSaving,
  saved,
  error,
}: {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
  saved: boolean;
  error?: string | null;
}) {
  if (!visible) return null;
  return (
    <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-gray-100">
      <p className={`text-[12px] ${error ? "text-red-500 font-semibold" : "text-gray-500"}`}>
        {error ? error : saved ? "✓ Changes saved" : "You have unsaved changes"}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onDiscard}
          disabled={isSaving}
          className="px-4 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50">
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-xl text-[13px] font-bold hover:bg-green-700 disabled:opacity-60 shadow-sm transition-all">
          {isSaving ? (
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <Check size={14} />
          ) : null}
          {isSaving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
