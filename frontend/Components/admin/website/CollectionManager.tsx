"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import FieldEditor from "./FieldEditor";
import { emptyObject, missingRequired, normalizeObject } from "@/lib/site-content/form";
import {
  useAdminItems, useCreateItem, useDeleteItem, useReorderItems, useSetItemPublished, useUpdateItem,
} from "@/lib/hooks/useSiteContent";
import type { AdminItem, CollectionDefinition, ContentData } from "@/lib/api/site-content";

/** Fields that are permanent once an item exists (other content refers to them). */
const IMMUTABLE_FIELDS: Record<string, string[]> = {
  "blog-categories": ["slug"],
  "video-categories": ["slug"],
};

type Editing = { mode: "new" } | { mode: "edit"; item: AdminItem } | null;

/** Generic list manager: create, edit, publish/unpublish, reorder and delete items of one collection. */
export default function CollectionManager({ def }: { def: CollectionDefinition }) {
  const { data: items, isLoading, isError, refetch } = useAdminItems(def.key);
  const [editing, setEditing] = useState<Editing>(null);
  const publish = useSetItemPublished(def.key);
  const reorder = useReorderItems(def.key);
  const remove = useDeleteItem(def.key);

  if (isLoading) return <p role="status" className="text-sm text-text-muted">Loading {def.title.toLowerCase()}…</p>;
  if (isError || !items) {
    return (
      <p role="alert" className="text-sm text-red-700">
        Couldn&apos;t load {def.title.toLowerCase()}.{" "}
        <button type="button" className="underline" onClick={() => void refetch()}>Try again</button>
      </p>
    );
  }

  const move = (index: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const ids = items.map((i) => i.id);
    const [m] = ids.splice(index, 1);
    ids.splice(to, 0, m);
    reorder.mutate(ids);
  };

  return (
    <section aria-labelledby={`coll-${def.key}`} className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`coll-${def.key}`} className="font-serif text-lg text-green-900">{def.title}</h3>
          <p className="text-[13px] text-text-muted">{def.description}</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing({ mode: "new" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14} aria-hidden="true" /> Add {def.noun}
          </button>
        )}
      </div>

      {editing && (
        <ItemForm
          key={editing.mode === "edit" ? editing.item.id : "new"}
          def={def}
          editing={editing}
          onDone={() => setEditing(null)}
        />
      )}

      {items.length === 0 && !editing && (
        <p className="rounded-xl border border-dashed border-cream-border p-6 text-center text-sm text-text-muted">
          No {def.title.toLowerCase()} yet. Visitors currently see an empty section here.
        </p>
      )}

      <ul className="space-y-2">
        {items.map((item, i) => {
          const title = String(item[def.titleField] ?? "Untitled");
          const subtitle = def.subtitleField ? String(item[def.subtitleField] ?? "") : "";
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-cream-border bg-white p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-green-900">{title}</p>
                {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  item.isPublished ? "bg-green-500/15 text-green-800" : "bg-gold/20 text-gold-dark"
                }`}>
                {item.isPublished ? "Published" : "Draft"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <RowBtn label={`Move ${title} up`} disabled={i === 0 || reorder.isPending} onClick={() => move(i, i - 1)}><ArrowUp size={14} /></RowBtn>
                <RowBtn label={`Move ${title} down`} disabled={i === items.length - 1 || reorder.isPending} onClick={() => move(i, i + 1)}><ArrowDown size={14} /></RowBtn>
                <RowBtn
                  label={`${item.isPublished ? "Unpublish" : "Publish"} ${title}`}
                  disabled={publish.isPending}
                  onClick={() => publish.mutate({ id: item.id, published: !item.isPublished })}>
                  {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                </RowBtn>
                <RowBtn label={`Edit ${title}`} onClick={() => setEditing({ mode: "edit", item })}><Pencil size={14} /></RowBtn>
                <RowBtn
                  label={`Delete ${title}`}
                  danger
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm(`Delete "${title}"? This removes it from the website and can't be undone.`)) remove.mutate(item.id);
                  }}>
                  <Trash2 size={14} />
                </RowBtn>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ItemForm({ def, editing, onDone }: { def: CollectionDefinition; editing: NonNullable<Editing>; onDone: () => void }) {
  const isNew = editing.mode === "new";
  const [form, setForm] = useState<ContentData>(() =>
    isNew ? emptyObject(def.fields) : normalizeObject(def.fields, editing.item as unknown as ContentData),
  );
  const create = useCreateItem(def.key);
  const update = useUpdateItem(def.key);
  const busy = create.isPending || update.isPending;
  const locked = new Set(isNew ? [] : (IMMUTABLE_FIELDS[def.key] ?? []));

  const submit = (publishNow: boolean) => {
    const missing = missingRequired(def.fields, form);
    if (missing.length) {
      toast.error(`Please fill in: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
      return;
    }
    if (isNew) create.mutate({ data: form, isPublished: publishNow }, { onSuccess: onDone });
    else update.mutate({ id: editing.item.id, data: form }, { onSuccess: onDone });
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(false); }}
      className="space-y-4 rounded-2xl border border-green-700/30 bg-white p-5"
      aria-label={`${isNew ? "New" : "Edit"} ${def.noun}`}>
      <h4 className="font-serif text-base text-green-900">{isNew ? `New ${def.noun}` : `Edit ${def.noun}`}</h4>
      <div className="grid gap-4 sm:grid-cols-2">
        {def.fields.map((f) => (
          <div key={f.name} className={["textarea", "markdown", "list"].includes(f.type) ? "sm:col-span-2" : ""}>
            <FieldEditor
              spec={f}
              value={form[f.name]}
              disabled={locked.has(f.name)}
              onChange={(v) => setForm((prev) => ({ ...prev, [f.name]: v }))}
            />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-cream-border pt-4">
        {isNew ? (
          <>
            <button type="button" disabled={busy} onClick={() => submit(true)} className="inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
              {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Save &amp; publish
            </button>
            <button type="submit" disabled={busy} className="rounded-full border border-green-800 px-5 py-2 text-sm font-semibold text-green-800 disabled:opacity-40">Save as draft</button>
          </>
        ) : (
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />} Save changes
          </button>
        )}
        <button type="button" onClick={onDone} className="rounded-full px-4 py-2 text-sm font-semibold text-text-muted hover:text-green-900">Cancel</button>
      </div>
    </form>
  );
}

function RowBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border focus-visible:ring-2 focus-visible:ring-green-600 disabled:opacity-30 ${
        danger ? "border-red-300 text-red-700 hover:bg-red-50" : "border-cream-border text-green-800 hover:bg-cream"
      }`}>
      {children}
    </button>
  );
}
