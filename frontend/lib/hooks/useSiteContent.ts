"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { extractErrorMessage } from "@/lib/api/client";
import {
  adminCreateItem, adminDeleteItem, adminGetBlocks, adminGetSchema, adminListItems,
  adminReorderItems, adminSaveBlock, adminSetItemPublished, adminUpdateItem,
  getBlocks, getCollection,
  type AdminBlock, type AdminItem, type ContentData,
} from "@/lib/api/site-content";
import type { BlockKey, BlockMap, CollectionKey, CollectionMap } from "@/lib/site-content/types";

export const contentKeys = {
  blocks: ["site-content", "blocks"] as const,
  collection: (c: string) => ["site-content", "collection", c] as const,
  adminSchema: ["admin", "site-content", "schema"] as const,
  adminBlocks: ["admin", "site-content", "blocks"] as const,
  adminItems: (c: string) => ["admin", "site-content", "items", c] as const,
};

/**
 * Public page sections. ONE request serves every section on the page (keys are
 * part of the cache key only so different pages cache separately). `data` is
 * undefined while loading or if the request failed; a section that was never
 * saved is simply an empty object — callers render nothing for missing parts.
 */
export function useBlocks<K extends BlockKey>(keys: readonly K[]) {
  const query = useQuery({
    queryKey: [...contentKeys.blocks, [...keys].sort().join(",")],
    queryFn: () => getBlocks([...keys]),
    staleTime: 30_000,
  });
  const blocks = query.data
    ? (Object.fromEntries(keys.map((k) => [k, query.data[k] ?? {}])) as unknown as { [P in K]: BlockMap[P] })
    : undefined;
  return { ...query, blocks };
}

export function useBlock<K extends BlockKey>(key: K) {
  const { blocks, ...rest } = useBlocks([key] as const);
  return { ...rest, block: blocks?.[key] as BlockMap[K] | undefined };
}

export function useCollection<K extends CollectionKey>(key: K) {
  return useQuery({
    queryKey: contentKeys.collection(key),
    queryFn: () => getCollection<CollectionMap[K]>(key),
    staleTime: 30_000,
  });
}

/* ─── Admin ──────────────────────────────────────────────────────────────── */

export const useContentSchema = () =>
  useQuery({ queryKey: contentKeys.adminSchema, queryFn: adminGetSchema, staleTime: 5 * 60_000 });

export const useAdminBlocks = () =>
  useQuery({ queryKey: contentKeys.adminBlocks, queryFn: adminGetBlocks });

export const useAdminItems = (collection: string) =>
  useQuery({ queryKey: contentKeys.adminItems(collection), queryFn: () => adminListItems(collection) });

/** Admin write: toast the outcome and refresh both the admin list and the public cache. */
function useContentMutation<TVars, TResult>(
  fn: (v: TVars) => Promise<TResult>,
  success: string,
  invalidate: (vars: TVars) => readonly (readonly unknown[])[],
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (_r, vars) => {
      toast.success(success);
      await Promise.all(invalidate(vars).map((queryKey) => qc.invalidateQueries({ queryKey })));
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export const useSaveBlock = () =>
  useContentMutation(
    (v: { key: string; data: ContentData }) => adminSaveBlock(v.key, v.data),
    "Saved — live on the website",
    () => [contentKeys.adminBlocks, contentKeys.blocks],
  );

export const useCreateItem = (collection: string) =>
  useContentMutation(
    (v: { data: ContentData; isPublished: boolean }) => adminCreateItem(collection, v.data, v.isPublished),
    "Created",
    () => [contentKeys.adminItems(collection), contentKeys.collection(collection)],
  );

export const useUpdateItem = (collection: string) =>
  useContentMutation(
    (v: { id: string; data: ContentData }) => adminUpdateItem(collection, v.id, v.data),
    "Saved",
    () => [contentKeys.adminItems(collection), contentKeys.collection(collection)],
  );

export const useSetItemPublished = (collection: string) =>
  useContentMutation(
    (v: { id: string; published: boolean }) => adminSetItemPublished(collection, v.id, v.published),
    "Updated",
    () => [contentKeys.adminItems(collection), contentKeys.collection(collection)],
  );

export const useReorderItems = (collection: string) =>
  useContentMutation(
    (ids: string[]) => adminReorderItems(collection, ids),
    "Order saved",
    () => [contentKeys.adminItems(collection), contentKeys.collection(collection)],
  );

export const useDeleteItem = (collection: string) =>
  useContentMutation(
    (id: string) => adminDeleteItem(collection, id),
    "Deleted",
    () => [contentKeys.adminItems(collection), contentKeys.collection(collection)],
  );

export type { AdminBlock, AdminItem };
