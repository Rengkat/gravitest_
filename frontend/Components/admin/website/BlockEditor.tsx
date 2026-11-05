"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import FieldEditor from "./FieldEditor";
import { missingRequired, normalizeObject } from "@/lib/site-content/form";
import { useSaveBlock } from "@/lib/hooks/useSiteContent";
import type { AdminBlock, BlockDefinition, ContentData } from "@/lib/api/site-content";

/** Edits one page section. Saving takes effect on the live website immediately. */
export default function BlockEditor({ def, saved }: { def: BlockDefinition; saved?: AdminBlock }) {
  const [form, setForm] = useState<ContentData>(() => normalizeObject(def.fields, saved?.data));
  const [dirty, setDirty] = useState(false);
  const save = useSaveBlock();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = missingRequired(def.fields, form);
    if (missing.length) {
      toast.error(`Please fill in: ${missing.slice(0, 3).join(", ")}${missing.length > 3 ? "…" : ""}`);
      return;
    }
    save.mutate({ key: def.key, data: form }, { onSuccess: () => setDirty(false) });
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-cream-border bg-white p-5">
      <div>
        <h3 className="font-serif text-lg text-green-900">{def.title}</h3>
        <p className="text-[13px] text-text-muted">{def.description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {def.fields.map((f) => (
          <div key={f.name} className={["textarea", "markdown", "list"].includes(f.type) ? "sm:col-span-2" : ""}>
            <FieldEditor
              spec={f}
              value={form[f.name]}
              onChange={(v) => {
                setForm((prev) => ({ ...prev, [f.name]: v }));
                setDirty(true);
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-cream-border pt-4">
        <button
          type="submit"
          disabled={save.isPending || !dirty}
          className="inline-flex items-center gap-2 rounded-full bg-green-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-40">
          {save.isPending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
          Save changes
        </button>
        <span role="status" className="text-xs text-text-muted">
          {dirty ? "Unsaved changes" : saved?.updatedAt ? `Last saved ${new Date(saved.updatedAt).toLocaleString()}` : "Not saved yet"}
        </span>
      </div>
    </form>
  );
}
