"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import * as studentsApi from "@/lib/api/students";
import * as libraryApi from "@/lib/api/library";
import { extractErrorMessage } from "@/lib/api/client";
import type { RecentSession, WeakTopic, LibraryItem, LibraryContentType } from "@/lib/constants/dashboard";

function mapContentType(t: libraryApi.BackendContentType): LibraryContentType {
  if (t === "video" || t === "audio") return "video";
  if (t === "ebook") return "ebook";
  return "doc"; // document, image, quiz, past_question, practice_set
}

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function useDashboardOverview() {
  const [overview, setOverview] = useState<studentsApi.StudentOverviewResponse | null>(null);
  const [recommended, setRecommended] = useState<LibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await studentsApi.getMyOverview();
      setOverview(data);

      // "Recommended for you" — real content-based filtering off the
      // student's actual weak-topic subjects, not a personalization/ML
      // engine (none exists on the backend). Falls back to newest
      // published content if there are no weak topics yet.
      const weakSubjects = Array.from(new Set(data.weakTopics.map((w) => w.subject))).slice(0, 2);
      let libraryResult;
      if (weakSubjects.length > 0) {
        libraryResult = await libraryApi.browseLibrary({
          subject: weakSubjects[0],
          sortBy: "averageRating",
          sortOrder: "DESC",
          limit: 3,
        });
      } else {
        libraryResult = await libraryApi.browseLibrary({
          sortBy: "createdAt",
          sortOrder: "DESC",
          limit: 3,
        });
      }
      setRecommended(
        libraryResult.data.map((item) => ({
          id: item.id,
          title: item.title,
          subject: item.subject ?? "General",
          type: mapContentType(item.contentType),
          duration: item.durationSeconds ? formatDuration(item.durationSeconds) : undefined,
          pages: item.totalPages ?? undefined,
        })),
      );
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recentSessions: RecentSession[] = useMemo(() => {
    if (!overview) return [];
    return overview.recentSessions.map((s) => ({
      id: s.id,
      examType: s.examType?.toUpperCase() ?? "Practice",
      subject: s.subjects?.[0] ?? s.sessionTitle ?? "Mixed",
      score: s.questionsCorrect,
      total: s.totalQuestions,
      date: formatRelativeDate(s.completedAt ?? s.startedAt),
      duration: formatDuration(s.timeSpentSeconds),
    }));
  }, [overview]);

  const weakTopics: WeakTopic[] = useMemo(() => {
    if (!overview) return [];
    return overview.weakTopics.map((w) => ({
      id: w.id,
      topic: w.topic,
      subject: w.subject,
      accuracy: Math.round(w.averageScore),
      // No priority field on the backend — derived from score, matching
      // the same thresholds WeakTopicCard already uses for its own color coding.
      priority: w.averageScore < 40 ? "high" : w.averageScore < 60 ? "medium" : "low",
    }));
  }, [overview]);

  return {
    isLoading,
    error,
    reload: load,
    overview,
    recentSessions,
    weakTopics,
    recommendedLibraryItems: recommended,
  };
}
