"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdminUser, UserStats, UserFilters, SortField } from "./types";
import * as adminApi from "@/lib/api/admin-dashboard";
import { extractErrorMessage } from "@/lib/api/client";

const ITEMS_PER_PAGE = 20;

const DEFAULT_FILTERS: UserFilters = {
  role: "",
  isActive: "",
  emailVerified: "",
  state: "",
  gender: "",
  createdFrom: "",
  createdTo: "",
};

const SORT_FIELD_MAP: Record<SortField, string> = {
  name: "firstName",
  joinDate: "createdAt",
  email: "email",
};

export function useUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [sortField, setSortField] = useState<SortField>("joinDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Debounce search so every keystroke doesn't fire a request.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // Reset to page 1 whenever a filter/search/sort actually changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, sortField, sortDirection]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi
      .listUsers({
        search: debouncedSearch || undefined,
        role: filters.role || undefined,
        isActive: filters.isActive === "" ? undefined : filters.isActive === "true",
        emailVerified: filters.emailVerified === "" ? undefined : filters.emailVerified === "true",
        state: filters.state || undefined,
        gender: filters.gender || undefined,
        createdFrom: filters.createdFrom || undefined,
        createdTo: filters.createdTo || undefined,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        sortBy: SORT_FIELD_MAP[sortField],
        sortOrder: sortDirection === "asc" ? "ASC" : "DESC",
      })
      .then((res) => {
        setUsers(res.data as unknown as AdminUser[]);
        setTotalItems(res.meta.totalItems);
        setTotalPages(res.meta.totalPages || 1);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [debouncedSearch, filters, sortField, sortDirection, currentPage, refreshKey]);

  // Stats bar — composed from a few lightweight count-only queries
  // (limit=1, read meta.totalItems), same approach as the overview page.
  useEffect(() => {
    Promise.allSettled([
      adminApi.listUsers({ limit: 1 }),
      adminApi.listUsers({ role: "student", limit: 1 }),
      adminApi.listUsers({ role: "professional_student", limit: 1 }),
      adminApi.listUsers({ role: "admin", limit: 1 }),
      adminApi.listUsers({ isActive: true, limit: 1 }),
      adminApi.listUsers({ isActive: false, limit: 1 }),
      adminApi.listUsers({ emailVerified: true, limit: 1 }),
    ]).then(([all, students, pros, admins, active, inactive, verified]) => {
      const val = (r: PromiseSettledResult<{ meta: { totalItems: number } }>) =>
        r.status === "fulfilled" ? r.value.meta.totalItems : 0;
      setStats({
        total: val(all),
        students: val(students),
        professionals: val(pros),
        admins: val(admins),
        active: val(active),
        inactive: val(inactive),
        emailVerified: val(verified),
      });
    });
  }, [refreshKey]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedUsers(new Set());
  const selectAll = () => setSelectedUsers(new Set(users.map((u) => u.id)));

  // Real mutations — every one of these is super_admin-only on the
  // backend; the UI (BulkActions / row actions) hides these for plain
  // "admin" viewers rather than showing a control that 403s.
  async function deactivate(id: string, reason?: string) {
    await adminApi.deactivateUser(id, { reason });
    refresh();
  }

  async function reactivate(id: string) {
    await adminApi.reactivateUser(id);
    refresh();
  }

  async function bulkDeactivate() {
    const ids = Array.from(selectedUsers);
    await Promise.allSettled(ids.map((id) => adminApi.deactivateUser(id, { reason: "Bulk action" })));
    clearSelection();
    refresh();
  }

  async function bulkReactivate() {
    const ids = Array.from(selectedUsers);
    await Promise.allSettled(ids.map((id) => adminApi.reactivateUser(id)));
    clearSelection();
    refresh();
  }

  function exportCsv(exportUsers: AdminUser[]) {
    const headers = ["ID", "Name", "Email", "Phone", "Role", "Status", "Verified", "Joined"];
    const rows = exportUsers.map((u) => [
      u.id,
      u.fullName,
      u.email,
      u.phoneNumber ?? "",
      u.role,
      u.isActive ? "active" : "inactive",
      u.isEmailVerified ? "verified" : "unverified",
      u.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return {
    users,
    stats,
    loading,
    error,
    totalItems,
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
    totalPages,
    selectedUsers,
    toggleSelect,
    clearSelection,
    selectAll,
    deactivate,
    reactivate,
    bulkDeactivate,
    bulkReactivate,
    exportCsv,
    refresh,
  };
}
