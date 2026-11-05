"use client";

import { useId } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import ImageUploadField from "@/Components/ImageUploadField";
import DynamicIcon from "@/Components/DynamicIcon";
import { ICON_NAMES } from "@/lib/site-content/icons";
import { emptyObject, isObject, itemSummary } from "@/lib/site-content/form";
import type { ContentData, FieldSpec, FieldValue } from "@/lib/api/site-content";

export const inputCls =
  "w-full rounded-lg border border-cream-border bg-white px-3 py-2 text-sm text-green-900 placeholder:text-text-light focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600";

interface FieldEditorProps {
  spec: FieldSpec;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
  /** Read-only (used for permanent identifiers like slugs once created). */
  disabled?: boolean;
}

/** Renders one schema field. Fully keyboard-operable: every control is a native input/select/button. */
export default function FieldEditor({ spec, value, onChange, disabled }: FieldEditorProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const describedBy = spec.help ? helpId : undefined;
  const label = (
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-green-900">
      {spec.label}
      {spec.required && <span aria-hidden="true" className="text-red-600"> *</span>}
      {spec.required && <span className="sr-only"> (required)</span>}
    </label>
  );
  const help = spec.help ? <p id={helpId} className="mt-1 text-xs text-text-muted">{spec.help}</p> : null;
  const counter =
    typeof value === "string" && spec.max && (spec.type === "text" || spec.type === "textarea") && value.length > spec.max * 0.8 ? (
      <p className={`mt-1 text-xs ${value.length > spec.max ? "text-red-600" : "text-text-muted"}`}>
        {value.length}/{spec.max}
      </p>
    ) : null;

  switch (spec.type) {
    case "boolean":
      return (
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-green-900">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
              aria-describedby={describedBy}
              className="h-4 w-4 accent-green-700"
            />
            {spec.label}
          </label>
          {help}
        </div>
      );

    case "textarea":
    case "markdown":
      return (
        <div>
          {label}
          <textarea
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            rows={spec.type === "markdown" ? 14 : 3}
            placeholder={spec.placeholder}
            aria-describedby={describedBy}
            className={`${inputCls} ${spec.type === "markdown" ? "font-mono" : ""}`}
          />
          {counter}
          {help}
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            className={inputCls}>
            {!spec.required && !(spec.options ?? []).some((o) => o.value === "") && <option value="">—</option>}
            {(spec.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {help}
        </div>
      );

    case "icon":
      return (
        <div>
          {label}
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cream-border bg-cream text-green-800">
              <DynamicIcon name={typeof value === "string" ? value : ""} size={18} />
            </span>
            <select
              id={id}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              aria-describedby={describedBy}
              className={inputCls}>
              <option value="">No icon</option>
              {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {help}
        </div>
      );

    case "image":
      return (
        <div>
          <span className="mb-1 block text-sm font-medium text-green-900">{spec.label}</span>
          <ImageUploadField
            label={spec.label}
            folder="thumbnails"
            value={typeof value === "string" && value ? { url: value } : null}
            onChange={(v) => onChange(v?.url ?? "")}
          />
          {help}
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            id={id}
            type="number"
            min={spec.min}
            max={spec.max}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            aria-describedby={describedBy}
            className={inputCls}
          />
          {help}
        </div>
      );

    case "color":
      return (
        <div>
          {label}
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label={`${spec.label} picker`}
              value={typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2e8b57"}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              className="h-9 w-12 cursor-pointer rounded border border-cream-border bg-white p-1"
            />
            <input
              id={id}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#2E8B57"
              aria-describedby={describedBy}
              className={inputCls}
            />
          </div>
          {help}
        </div>
      );

    case "list":
      return <ListEditor spec={spec} value={value} onChange={onChange} />;

    default: {
      const htmlType = spec.type === "email" ? "email" : spec.type === "date" ? "date" : spec.type === "url" ? "text" : "text";
      return (
        <div>
          {label}
          <input
            id={id}
            type={htmlType}
            inputMode={spec.type === "url" ? "url" : undefined}
            value={typeof value === "string" ? (spec.type === "date" ? value.slice(0, 10) : value) : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={spec.placeholder}
            aria-describedby={describedBy}
            disabled={disabled}
            className={`${inputCls} ${disabled ? "cursor-not-allowed bg-cream text-text-muted" : ""}`}
          />
          {counter}
          {help}
        </div>
      );
    }
  }
}

/* ─── Repeatable lists (strings or structured items) ─────────────────────── */

function ListEditor({ spec, value, onChange }: FieldEditorProps) {
  const items = Array.isArray(value) ? value : [];
  const max = spec.max ?? 100;
  const noun = spec.itemLabel ?? "item";

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, spec.item ? emptyObject(spec.item) : ""]);

  return (
    <fieldset className="rounded-xl border border-cream-border bg-cream/40 p-3">
      <legend className="px-1 text-sm font-semibold text-green-900">
        {spec.label} <span className="font-normal text-text-muted">({items.length}/{max})</span>
      </legend>
      {spec.help && <p className="mb-2 text-xs text-text-muted">{spec.help}</p>}

      {items.length === 0 && <p className="py-2 text-sm text-text-muted">Nothing here yet.</p>}

      <ol className="space-y-3">
        {items.map((entry, i) => {
          const rowLabel = `${spec.label} ${i + 1}`;
          return (
            <li key={i} className="rounded-lg border border-cream-border bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-semibold uppercase tracking-wide text-text-muted">
                  #{i + 1}
                  {spec.item && isObject(entry) && itemSummary(spec.item, entry) ? ` · ${itemSummary(spec.item, entry)}` : ""}
                </span>
                <span className="flex shrink-0 gap-1">
                  <IconBtn label={`Move ${rowLabel} up`} disabled={i === 0} onClick={() => move(i, i - 1)}><ArrowUp size={14} /></IconBtn>
                  <IconBtn label={`Move ${rowLabel} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}><ArrowDown size={14} /></IconBtn>
                  <IconBtn label={`Remove ${rowLabel}`} danger onClick={() => remove(i)}><Trash2 size={14} /></IconBtn>
                </span>
              </div>

              {spec.item && isObject(entry) ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {spec.item.map((f) => (
                    <div key={f.name} className={["textarea", "markdown", "list"].includes(f.type) ? "sm:col-span-2" : ""}>
                      <FieldEditor
                        spec={f}
                        value={entry[f.name]}
                        onChange={(v) => onChange(items.map((e, idx) => (idx === i && isObject(e) ? { ...e, [f.name]: v } : e)))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <input
                  aria-label={rowLabel}
                  value={typeof entry === "string" ? entry : ""}
                  onChange={(e) => onChange(items.map((v, idx) => (idx === i ? e.target.value : v)))}
                  className={inputCls}
                />
              )}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={add}
        disabled={items.length >= max}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-800 px-3.5 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-800 hover:text-white disabled:opacity-40">
        <Plus size={14} aria-hidden="true" /> Add {noun}
      </button>
    </fieldset>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded-md border focus-visible:ring-2 focus-visible:ring-green-600 disabled:opacity-30 ${
        danger ? "border-red-300 text-red-700 hover:bg-red-50" : "border-cream-border text-green-800 hover:bg-cream"
      }`}>
      {children}
    </button>
  );
}

export type { ContentData };
