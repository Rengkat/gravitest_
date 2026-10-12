"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import type {
  ContentItem,
  ContentStats,
  ContentFilters,
  SortField,
  ContentType,
} from "@/types/admin-contents";
import {
  listAdminLibrary,
  deleteLibraryContent,
  publishLibraryContent,
  unpublishLibraryContent,
  updateLibraryContent,
} from "@/lib/api/library";
import { mapLibraryContentToContentItem } from "@/lib/api/mapLibraryContent";
import { extractErrorMessage } from "@/lib/api/client";

const ITEMS_PER_PAGE = 20;

const DEFAULT_FILTERS: ContentFilters = {
  type: "",
  accessLevel: "",
  subject: "",
  audience: "",
  examTarget: "",
  status: "",
  isFeatured: "",
  isFree: "",
  minRating: "",
  dateFrom: "",
  dateTo: "",
};

function buildStats(items: ContentItem[]): ContentStats {
  const byType = {} as Record<ContentType, number>;
  const byStatus = { published: 0, draft: 0, archived: 0, review: 0 };
  const byAccess = { free: 0, basic: 0, standard: 0, premium: 0, enterprise: 0 };
  const byAudience = { secondary: 0, professional: 0 };

  for (const item of items) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    byStatus[item.status] += 1;
    byAccess[item.accessLevel] += 1;
    byAudience[item.audience] += 1;
  }

  return {
    totalItems: items.length,
    byType,
    byAccess,
    byAudience,
    byStatus,
    totalViews: items.reduce((s, i) => s + i.views, 0),
    totalDownloads: items.reduce((s, i) => s + i.downloads, 0),
    totalRevenue: items.reduce((s, i) => s + i.revenue, 0),
    averageRating: items.length
      ? items.reduce((s, i) => s + i.rating, 0) / items.length
      : 0,
    featuredItems: items.filter((i) => i.isFeatured).length,
    trendingItems: items.filter((i) => i.isTrending).length,
    newItems: items.filter((i) => i.isNew).length,
    topAuthors: [],
    topSubjects: [],
    revenueByType: [],
    viewsByMonth: [],
  };
}

export function useContent() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ContentFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("dateAdded");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      // admin/all pulls every record (drafts + archived included). The
      // backend caps `limit` at 100 (PaginationDto's @Max(100)) — asking
      // for more throws a validation error, the request fails, `items`
      // stays empty, and every stat on this page silently reads as 0.
      // 100 is plenty for now — swap to real server-side pagination once
      // the catalogue outgrows a single page (the API already supports
      // page/limit).
      const result = await listAdminLibrary({ limit: 100, sortBy: "createdAt", sortOrder: "DESC" });
      setItems(result.data.map(mapLibraryContentToContentItem));
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const stats = useMemo<ContentStats | null>(
    // Archived (soft-deleted) items are excluded here so the headline
    // counts match what "Showing N items" actually displays by default —
    // otherwise a deleted item keeps inflating Total/E-Books/etc forever
    // even though it's hidden from the grid.
    () => {
      if (!items.length && loading) return null;
      return buildStats(items.filter((i) => i.status !== "archived"));
    },
    [items, loading],
  );

  // ─── FILTERING + SORTING ──────────────────────────────────
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (
            !item.title.toLowerCase().includes(q) &&
            !item.description.toLowerCase().includes(q) &&
            !item.author.toLowerCase().includes(q) &&
            !item.tags.some((t) => t.toLowerCase().includes(q))
          )
            return false;
        }
        if (filters.type && item.type !== filters.type) return false;
        if (filters.accessLevel && item.accessLevel !== filters.accessLevel) return false;
        if (filters.subject && item.subject !== filters.subject) return false;
        if (filters.audience && item.audience !== filters.audience) return false;
        if (filters.examTarget && item.examTarget !== filters.examTarget) return false;
        if (filters.status) {
          if (item.status !== filters.status) return false;
        } else if (item.status === "archived") {
          // Deleting an item soft-deletes it (isActive=false) rather than
          // erasing the row, so it keeps coming back on every refetch
          // unless we explicitly hide it here. Selecting the "Archived"
          // status filter still shows it — this only hides it from the
          // default, unfiltered view, matching what "delete" implies.
          return false;
        }
        if (filters.isFeatured === "true" && !item.isFeatured) return false;
        if (filters.isFree === "true" && !item.isFree) return false;
        if (filters.isFree === "false" && item.isFree) return false;
        if (filters.minRating && item.rating < parseFloat(filters.minRating)) return false;
        if (filters.dateFrom && item.dateAdded < filters.dateFrom) return false;
        if (filters.dateTo && item.dateAdded > filters.dateTo) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortField) {
          case "title":
            cmp = a.title.localeCompare(b.title);
            break;
          case "views":
            cmp = a.views - b.views;
            break;
          case "downloads":
            cmp = a.downloads - b.downloads;
            break;
          case "rating":
            cmp = a.rating - b.rating;
            break;
          case "revenue":
            cmp = a.revenue - b.revenue;
            break;
          case "dateAdded":
            cmp = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
            break;
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
  }, [items, searchQuery, filters, sortField, sortDirection]);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  // ─── HANDLERS ────────────────────────────────────────────
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedItems(new Set());

  const deleteItem = async (id: string) => {
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelectedItems((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
    try {
      await deleteLibraryContent(id);
    } catch (err) {
      setItems(previous); // roll back on failure
      toast.error(extractErrorMessage(err));
    }
  };

  const deleteSelected = async () => {
    const ids = Array.from(selectedItems);
    const previous = items;
    setItems((prev) => prev.filter((i) => !selectedItems.has(i.id)));
    clearSelection();
    try {
      await Promise.all(ids.map((id) => deleteLibraryContent(id)));
    } catch (err) {
      setItems(previous);
      toast.error(extractErrorMessage(err));
    }
  };

  const addItem = (item: ContentItem) => {
    setItems((prev) => [item, ...prev]);
  };

  const toggleFeatured = async (id: string) => {
    const previous = items;
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const nextFeatured = !current.isFeatured;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isFeatured: nextFeatured } : i)));
    try {
      await updateLibraryContent(id, { isFeatured: nextFeatured });
    } catch (err) {
      setItems(previous); // roll back on failure
      toast.error(extractErrorMessage(err));
    }
  };

  const updateStatus = async (id: string, status: ContentItem["status"]) => {
    const previous = items;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      if (status === "published") await publishLibraryContent(id);
      else if (status === "draft" || status === "archived") await unpublishLibraryContent(id);
    } catch (err) {
      setItems(previous);
      toast.error(extractErrorMessage(err));
    }
  };

  const exportCsv = (exportItems: ContentItem[]) => {
    const headers = [
      "ID",
      "Title",
      "Type",
      "Audience",
      "Exam",
      "Subject",
      "Access",
      "Price",
      "Views",
      "Downloads",
      "Rating",
      "Revenue",
      "Status",
      "Date Added",
    ];
    const rows = exportItems.map((i) => [
      i.id,
      i.title,
      i.type,
      i.audience,
      i.examLabel,
      i.subject,
      i.accessLevel,
      i.price,
      i.views,
      i.downloads,
      i.rating,
      i.revenue,
      i.status,
      i.dateAdded,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `content_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return {
    items,
    stats,
    loading,
    refetch,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    activeFilterCount,
    clearFilters,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    paginatedItems,
    totalPages,
    filteredItems,
    selectedItems,
    toggleSelect,
    clearSelection,
    addItem,
    deleteItem,
    deleteSelected,
    toggleFeatured,
    updateStatus,
    exportCsv,
  };
}
