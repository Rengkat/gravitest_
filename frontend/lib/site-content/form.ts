import type { ContentData, FieldSpec, FieldValue } from "@/lib/api/site-content";

/** Blank value for one field (what a "new item" form starts with). */
export function emptyField(spec: FieldSpec): FieldValue {
  switch (spec.type) {
    case "boolean": return false;
    case "number": return null;
    case "list": return [];
    default: return "";
  }
}

export function emptyObject(fields: FieldSpec[]): ContentData {
  return Object.fromEntries(fields.map((f) => [f.name, emptyField(f)]));
}

/** Fill in any field the saved data doesn't have, so every input is controlled. */
export function normalizeObject(fields: FieldSpec[], data: ContentData | undefined): ContentData {
  const src = data ?? {};
  const out: ContentData = {};
  for (const f of fields) {
    const v = src[f.name];
    if (f.type === "list") {
      const arr = Array.isArray(v) ? v : [];
      out[f.name] = f.item
        ? arr.map((e) => normalizeObject(f.item!, isObject(e) ? e : {}))
        : arr.filter((e): e is string => typeof e === "string");
    } else if (v === undefined || v === null) {
      out[f.name] = emptyField(f);
    } else {
      out[f.name] = v;
    }
  }
  return out;
}

export function isObject(v: unknown): v is ContentData {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Client-side required-field check, mirroring the server so admins get instant, specific feedback. */
export function missingRequired(fields: FieldSpec[], data: ContentData, prefix = ""): string[] {
  const missing: string[] = [];
  for (const f of fields) {
    const v = data[f.name];
    const where = prefix ? `${prefix} → ${f.label}` : f.label;
    if (f.type === "list") {
      const arr = Array.isArray(v) ? v : [];
      if (f.item) {
        arr.forEach((e, i) => {
          if (isObject(e)) missing.push(...missingRequired(f.item!, e, `${f.label} #${i + 1}`));
        });
      }
    } else if (f.required) {
      const empty = v === null || v === undefined || (typeof v === "string" && v.trim() === "");
      if (empty) missing.push(where);
    }
  }
  return missing;
}

/** Short human summary of a list item for its collapsed header. */
export function itemSummary(fields: FieldSpec[], data: ContentData): string {
  const first = fields.find((f) => ["text", "email", "url"].includes(f.type) && typeof data[f.name] === "string" && String(data[f.name]).trim());
  return first ? String(data[first.name]) : "";
}
