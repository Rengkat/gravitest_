import { apiClient } from "./client";

/* ─── Schema (served by the backend; the admin forms render from it) ───────── */

export type FieldType =
  | "text" | "textarea" | "markdown" | "url" | "image" | "email" | "number"
  | "boolean" | "select" | "icon" | "color" | "date" | "list";

export interface SelectOption { value: string; label: string }

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  max?: number;
  min?: number;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  item?: FieldSpec[];
  itemLabel?: string;
}

export interface BlockDefinition {
  key: string;
  title: string;
  description: string;
  group: string;
  fields: FieldSpec[];
}

export interface CollectionDefinition {
  key: string;
  title: string;
  description: string;
  group: string;
  noun: string;
  titleField: string;
  subtitleField?: string;
  fields: FieldSpec[];
}

export interface ContentSchema {
  blocks: BlockDefinition[];
  collections: CollectionDefinition[];
}

/* ─── Content shapes ──────────────────────────────────────────────────────── */

export type FieldValue = string | number | boolean | null | FieldValue[] | { [k: string]: FieldValue };
export type ContentData = { [k: string]: FieldValue };

export interface AdminBlock { key: string; data: ContentData; updatedAt: string | null }

export interface ContentItemBase { id: string; sortOrder: number; publishedAt: string | null }
export type PublicItem<T> = T & ContentItemBase;
export type AdminItem<T = ContentData> = PublicItem<T> & {
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ─── Public ──────────────────────────────────────────────────────────────── */

export async function getBlocks(keys?: string[]): Promise<Record<string, ContentData>> {
  const { data } = await apiClient.get("/site-content/blocks", {
    params: keys?.length ? { keys: keys.join(",") } : undefined,
  });
  return data;
}

export async function getCollection<T>(collection: string): Promise<PublicItem<T>[]> {
  const { data } = await apiClient.get(`/site-content/collections/${collection}`);
  return data;
}

/* ─── Admin ───────────────────────────────────────────────────────────────── */

export async function adminGetSchema(): Promise<ContentSchema> {
  return (await apiClient.get("/admin/site-content/schema")).data;
}
export async function adminGetBlocks(): Promise<AdminBlock[]> {
  return (await apiClient.get("/admin/site-content/blocks")).data;
}
export async function adminSaveBlock(key: string, data: ContentData): Promise<AdminBlock> {
  return (await apiClient.put(`/admin/site-content/blocks/${key}`, { data })).data;
}
export async function adminListItems(collection: string): Promise<AdminItem[]> {
  return (await apiClient.get(`/admin/site-content/collections/${collection}`)).data;
}
export async function adminCreateItem(collection: string, data: ContentData, isPublished: boolean): Promise<AdminItem> {
  return (await apiClient.post(`/admin/site-content/collections/${collection}`, { data, isPublished })).data;
}
export async function adminUpdateItem(collection: string, id: string, data: ContentData): Promise<AdminItem> {
  return (await apiClient.patch(`/admin/site-content/collections/${collection}/${id}`, { data })).data;
}
export async function adminSetItemPublished(collection: string, id: string, published: boolean): Promise<AdminItem> {
  return (await apiClient.patch(`/admin/site-content/collections/${collection}/${id}/${published ? "publish" : "unpublish"}`)).data;
}
export async function adminReorderItems(collection: string, ids: string[]): Promise<AdminItem[]> {
  return (await apiClient.patch(`/admin/site-content/collections/${collection}/reorder`, { ids })).data;
}
export async function adminDeleteItem(collection: string, id: string): Promise<void> {
  await apiClient.delete(`/admin/site-content/collections/${collection}/${id}`);
}
