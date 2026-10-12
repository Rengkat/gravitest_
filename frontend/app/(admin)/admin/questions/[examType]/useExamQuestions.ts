"use client";

import { useState, useEffect, useCallback } from "react";
import type { ExamType, QuestionFilters, Question } from "@/types/questions";
import { DEFAULT_FILTERS } from "@/types/questions";
import * as questionsApi from "@/lib/api/questions";
import { extractErrorMessage } from "@/lib/api/client";

const PAGE_SIZE = 20;

export function useExamQuestions(examType: ExamType, initialFilters: Partial<QuestionFilters> = {}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<QuestionFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const [debouncedSearch, setDebouncedSearch] = useState(filters.searchQuery);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.searchQuery), 350);
    return () => clearTimeout(id);
  }, [filters.searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [filters.candidateType, filters.year, filters.subject, filters.topic, filters.type, filters.difficulty, filters.status, debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    questionsApi
      .listQuestions({
        examType,
        candidateType:
          filters.candidateType && filters.candidateType !== "all"
            ? filters.candidateType
            : undefined,
        year: filters.year ? parseInt(filters.year, 10) : undefined,
        subject: filters.subject || undefined,
        topic: filters.topic || undefined,
        type: filters.type && filters.type !== "all" ? filters.type : undefined,
        difficulty: filters.difficulty || undefined,
        isActive: filters.status === "" ? undefined : filters.status === "published",
        search: debouncedSearch || undefined,
        page,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "DESC",
      })
      .then((res) => {
        setQuestions(res.data);
        setTotal(res.meta.totalItems);
        setTotalPages(res.meta.totalPages || 1);
      })
      .catch((err) => setError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [examType, filters.candidateType, filters.year, filters.subject, filters.topic, filters.type, filters.difficulty, filters.status, debouncedSearch, page, refreshKey]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());
  const selectAll = () => setSelected(new Set(questions.map((q) => q.id)));

  async function togglePublish(q: Question) {
    if (q.isActive) await questionsApi.unpublishQuestion(q.id);
    else await questionsApi.publishQuestion(q.id);
    refresh();
  }

  async function duplicate(id: string) {
    await questionsApi.duplicateQuestion(id);
    refresh();
  }

  async function remove(id: string) {
    await questionsApi.deleteQuestion(id);
    refresh();
  }

  async function bulkActivate(active: boolean) {
    await questionsApi.bulkSetActive(Array.from(selected), active);
    clearSelection();
    refresh();
  }

  async function bulkDelete() {
    await questionsApi.bulkDeleteQuestions(Array.from(selected));
    clearSelection();
    refresh();
  }

  return {
    questions,
    total,
    totalPages,
    page,
    setPage,
    loading,
    error,
    filters,
    setFilters,
    selected,
    toggleSelect,
    clearSelection,
    selectAll,
    togglePublish,
    duplicate,
    remove,
    bulkActivate,
    bulkDelete,
    refresh,
  };
}
