"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { ConversationDetail } from "../components/ConversationDetail";
import type { AISessionDetail } from "../../components/AISessionDetails";
import * as aiAdminApi from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

function mapSession(c: aiAdminApi.AiConversation): AISessionDetail {
  return {
    id: c.id,
    sessionId: c.id,
    userId: c.userId,
    userName: `User ${c.userId.slice(0, 8)}`,
    userEmail: "",
    userRole: "student",
    feature: c.feature,
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
    messages: (c.messages ?? []).map((m) => ({
      id: m.id,
      conversationId: c.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      timestamp: m.createdAt,
      tokens: m.tokensUsed ?? 0,
      cost: 0, // per-message cost isn't tracked separately from conversation totalCostUsd
    })),
  };
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const [session, setSession] = useState<AISessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await aiAdminApi.getConversation(id);
      setSession(mapSession(data));
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Admin-initiated flagging has no backend endpoint yet — only unflag does
  // (PATCH /ai/admin/conversations/:id/unflag). onFlag is deliberately not
  // passed to ConversationDetail below, which hides that button entirely
  // (it's optional-prop-gated) rather than wiring it to nothing.
  const handleDismissFlag = async (sessionId: string) => {
    const prev = session;
    setSession((s) => (s ? { ...s, isFlagged: false, flagReason: undefined } : s));
    try {
      await aiAdminApi.unflagConversation(sessionId);
    } catch {
      setSession(prev);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-900 transition-colors">
          <ArrowLeft size={15} /> Back
        </button>
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error ?? "Conversation not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-green-900 transition-colors">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="font-serif text-xl text-green-900">Session Detail</h1>
          <span className="font-mono text-[11px] text-text-muted bg-cream px-2 py-0.5 rounded-full">
            {session.sessionId}
          </span>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-cream transition-all text-[12px]">
          <RefreshCw size={13} className={`text-text-muted ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <ConversationDetail session={session} onDismissFlag={handleDismissFlag} />
    </div>
  );
}
