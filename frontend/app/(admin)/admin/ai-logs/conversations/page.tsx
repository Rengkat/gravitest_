"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Flag, CheckCircle, Activity, Loader2 } from "lucide-react";
import { ConversationList } from "./components/ConversationList";
import type { AIConversation } from "../types";
import * as aiAdminApi from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

// Maps the real backend AiConversation onto the display shape ConversationList
// already expects. userName/userEmail/userRole have no bulk-resolve lookup
// wired up yet, so they fall back to a short userId — see the same note in
// useAIData.ts.
function mapConversation(c: aiAdminApi.AiConversation): AIConversation {
  return {
    id: c.id,
    sessionId: c.id,
    userId: c.userId,
    userName: `User ${c.userId.slice(0, 8)}`,
    userEmail: "",
    userRole: "student",
    feature: c.feature,
    // Backend model IDs are admin-defined free strings (AiModelConfig.modelId),
    // not the fixed AIModel union this page was originally typed against —
    // cast rather than force a stale enum.
    model: (c.lastModelId ?? "unknown") as any,
    subject: c.subject ?? undefined,
    topic: c.topic ?? undefined,
    examType: c.examType ?? undefined,
    startTime: c.createdAt,
    endTime: c.status === "completed" ? (c.lastActivityAt ?? undefined) : undefined,
    lastActivity: c.lastActivityAt ?? c.createdAt,
    messageCount: c.messageCount,
    totalTokens: c.totalTokens,
    totalCost: c.totalCostUsd,
    status: c.status,
    isFlagged: c.isFlagged,
    flagReason: c.flagReason ?? undefined,
    userRating: c.userRating ?? undefined,
    userFeedback: c.userFeedback ?? undefined,
  };
}

export default function AIConversationsPage() {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await aiAdminApi.listConversations({ limit: 100 });
      setConversations(result.data.map(mapConversation));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flagged = conversations.filter((c) => c.isFlagged).length;
  const active = conversations.filter((c) => c.status === "active").length;
  const completed = conversations.filter((c) => c.status === "completed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-green-900">AI Conversations</h1>
        <p className="text-text-muted text-[13px]">Monitor and review AI tutoring sessions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin text-green-700" />
        </div>
      ) : error ? (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: MessageSquare,
                label: "Total Sessions",
                value: conversations.length,
                color: "#2e8b57",
                bg: "#2e8b5715",
              },
              { icon: Activity, label: "Active Now", value: active, color: "#3b82f6", bg: "#3b82f615" },
              {
                icon: CheckCircle,
                label: "Completed",
                value: completed,
                color: "#10b981",
                bg: "#10b98115",
              },
              { icon: Flag, label: "Flagged", value: flagged, color: "#ef4444", bg: "#ef444415" },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white border"
                style={{ borderColor: "rgba(30,80,50,0.08)" }}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: bg }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <div>
                  <div className="text-[18px] font-bold text-green-900 leading-tight">{value}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    {label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ConversationList conversations={conversations} basePath="/admin/ai-logs/conversations" />
        </>
      )}
    </div>
  );
}
