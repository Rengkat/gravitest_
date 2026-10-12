"use client";

import { Plus, Trash2, Table as TableIcon } from "lucide-react";
import type { EssayPart } from "@/types/questions";
import ImageUploadField from "@/Components/ImageUploadField";

const inputCls =
  "px-2.5 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 transition-all";

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let num = n,
    out = "";
  for (const [v, s] of map)
    while (num >= v) {
      out += s;
      num -= v;
    }
  return out || String(n);
}

function suggestLabel(depth: number, indexAmongSiblings: number): string {
  if (depth === 0) return String(indexAmongSiblings + 1);
  if (depth === 1) return `(${String.fromCharCode(97 + indexAmongSiblings)})`;
  if (depth === 2) return `(${toRoman(indexAmongSiblings + 1)})`;
  return `Part ${indexAmongSiblings + 1}`;
}

function newPart(depth: number, indexAmongSiblings: number): EssayPart {
  return { label: suggestLabel(depth, indexAmongSiblings), text: "", children: [] };
}

function TableEditor({
  table,
  onChange,
}: {
  table: string[][] | null | undefined;
  onChange: (t: string[][] | null) => void;
}) {
  if (!table) {
    return (
      <button
        type="button"
        onClick={() =>
          onChange([
            ["", ""],
            ["", ""],
          ])
        }
        className="mt-2 text-[11px] font-semibold text-gray-500 hover:text-green-700 flex items-center gap-1">
        <TableIcon size={12} /> Add table
      </button>
    );
  }
  const rows = table.length;
  const cols = table[0]?.length ?? 0;

  function setCell(r: number, c: number, v: string) {
    const next = table!.map((row) => [...row]);
    next[r][c] = v;
    onChange(next);
  }

  return (
    <div className="mt-2">
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {table.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="p-0.5">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className="w-24 px-1.5 py-1 rounded border border-gray-200 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-400"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-3 mt-1.5">
        <button
          type="button"
          onClick={() => onChange([...table, Array(cols).fill("")])}
          className="text-[11px] text-gray-500 hover:text-green-700">
          + Row
        </button>
        <button
          type="button"
          onClick={() => onChange(table.map((row) => [...row, ""]))}
          className="text-[11px] text-gray-500 hover:text-green-700">
          + Column
        </button>
        <button
          type="button"
          onClick={() => onChange(rows > 1 ? table.slice(0, -1) : null)}
          className="text-[11px] text-gray-500 hover:text-red-600">
          − Row
        </button>
        {cols > 1 && (
          <button
            type="button"
            onClick={() => onChange(table.map((row) => row.slice(0, -1)))}
            className="text-[11px] text-gray-500 hover:text-red-600">
            − Column
          </button>
        )}
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[11px] text-red-600 ml-auto">
          Remove table
        </button>
      </div>
    </div>
  );
}

function PartNode({
  part,
  depth,
  onChange,
  onRemove,
}: {
  part: EssayPart;
  depth: number;
  onChange: (p: EssayPart) => void;
  onRemove: () => void;
}) {
  const children = part.children ?? [];

  return (
    <div
      className={depth > 0 ? "border-l-2 pl-3 mt-2" : "mt-3"}
      style={{ marginLeft: depth > 0 ? 12 : 0, borderColor: "rgba(30,80,50,0.15)" }}>
      <div className="flex items-start gap-2">
        <input
          value={part.label}
          onChange={(e) => onChange({ ...part, label: e.target.value })}
          className={`${inputCls} w-16 font-semibold text-center shrink-0`}
          title="Part label"
        />
        <textarea
          rows={2}
          value={part.text ?? ""}
          onChange={(e) => onChange({ ...part, text: e.target.value })}
          placeholder="Instructions or sub-question text…"
          className={`${inputCls} flex-1`}
        />
        <input
          type="number"
          min={0}
          value={part.maxScore ?? ""}
          onChange={(e) =>
            onChange({ ...part, maxScore: e.target.value ? parseInt(e.target.value, 10) : null })
          }
          placeholder="marks"
          className={`${inputCls} w-16 shrink-0`}
          title="Marks for this part"
        />
        <div className="shrink-0">
          <ImageUploadField
            label=""
            compact
            value={part.imageUrl ? { url: part.imageUrl } : null}
            onChange={(v) => onChange({ ...part, imageUrl: v?.url ?? null })}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remove this part"
          className="p-2 rounded-lg text-red-500 hover:bg-red-50 shrink-0">
          <Trash2 size={14} />
        </button>
      </div>

      <TableEditor table={part.table} onChange={(t) => onChange({ ...part, table: t })} />

      {children.map((child, idx) => (
        <PartNode
          key={idx}
          part={child}
          depth={depth + 1}
          onChange={(updated) =>
            onChange({ ...part, children: children.map((c, i) => (i === idx ? updated : c)) })
          }
          onRemove={() => onChange({ ...part, children: children.filter((_, i) => i !== idx) })}
        />
      ))}

      {depth < 3 && (
        <button
          type="button"
          onClick={() =>
            onChange({ ...part, children: [...children, newPart(depth + 1, children.length)] })
          }
          className="mt-1.5 ml-4 text-[11px] font-semibold text-gray-500 hover:text-green-700 flex items-center gap-1">
          <Plus size={11} /> Add sub-part
        </button>
      )}
    </div>
  );
}

interface Props {
  parts: EssayPart[];
  onChange: (parts: EssayPart[]) => void;
}

export default function EssayStructureEditor({ parts, onChange }: Props) {
  return (
    <div
      className="rounded-xl border border-dashed p-4"
      style={{ borderColor: "rgba(30,80,50,0.2)" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-bold text-green-900 uppercase tracking-wide">
          Structured parts (optional)
        </span>
      </div>
      <p className="text-[11px] text-text-muted mb-2">
        Use this for questions with numbering like 1 → (a) → (i) — leave empty for a plain essay
        question.
      </p>

      {parts.map((part, idx) => (
        <PartNode
          key={idx}
          part={part}
          depth={0}
          onChange={(updated) => onChange(parts.map((p, i) => (i === idx ? updated : p)))}
          onRemove={() => onChange(parts.filter((_, i) => i !== idx))}
        />
      ))}

      <button
        type="button"
        onClick={() => onChange([...parts, newPart(0, parts.length)])}
        className="mt-3 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-[12px] font-semibold text-gray-600 flex items-center gap-1.5">
        <Plus size={13} /> Add {parts.length === 0 ? "first" : "top-level"} part
      </button>
    </div>
  );
}
