"use client";

import { useState, useEffect } from "react";
import { Flag, Eye, CheckCircle, XCircle, MessageSquare, Clock } from "lucide-react";

interface FlaggedSession {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
  messages: FlaggedMessage[];
  status: "pending" | "reviewed" | "dismissed";
}

interface FlaggedMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  flagReason: string;
  timestamp: string;
}

interface Props {
  sessions: FlaggedSession[];
  onUnflag?: (sessionId: string) => Promise<void>;
}

export function FlaggedConversations({ sessions: initialSessions, onUnflag }: Props) {
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSession, setSelectedSession] = useState<FlaggedSession | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const filteredSessions = sessions.filter((s) => filter === "all" || s.status === filter);

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  // The backend only has a binary flagged/not-flagged state (isFlagged +
  // flagReason) — no separate "reviewed" vs "dismissed" outcome. Both
  // actions here call the same PATCH /ai/admin/conversations/:id/unflag
  // and just differ in the local status label shown before the row
  // disappears from the list (unflagged conversations no longer come back
  // from the flagged=true query on next refresh).
  const resolve = async (sessionId: string, label: "reviewed" | "dismissed") => {
    setActioningId(sessionId);
    try {
      await onUnflag?.(sessionId);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: label } : s)));
    } finally {
      setActioningId(null);
    }
  };

  const handleDismiss = (sessionId: string) => resolve(sessionId, "dismissed");
  const handleMarkReviewed = (sessionId: string) => resolve(sessionId, "reviewed");

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Pending Review"
          value={sessions.filter((s) => s.status === "pending").length}
          color="#ef4444"
        />
        <StatCard
          label="High Severity"
          value={sessions.filter((s) => s.severity === "high").length}
          color="#f59e0b"
        />
        <StatCard
          label="Reviewed"
          value={sessions.filter((s) => s.status === "reviewed").length}
          color="#10b981"
        />
        <StatCard
          label="Dismissed"
          value={sessions.filter((s) => s.status === "dismissed").length}
          color="#6b7280"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-2">
        {(["all", "pending", "reviewed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              filter === f
                ? "bg-green-800 text-white"
                : "bg-white border border-gray-200 text-text-muted hover:bg-cream"
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {filteredSessions.map((session) => (
          <div
            key={session.id}
            className={`bg-white rounded-2xl border overflow-hidden transition-all ${
              session.severity === "high" ? "border-red-200" : "border-amber-200"
            }`}>
            <div className="p-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      session.severity === "high"
                        ? "bg-red-500"
                        : session.severity === "medium"
                          ? "bg-amber-500"
                          : "bg-yellow-500"
                    }`}
                  />
                  <span className="text-[13px] font-semibold text-green-900">
                    {session.userName}
                  </span>
                  <span className="text-[11px] text-text-muted">User ID: {session.userId}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                      session.status === "pending"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }`}>
                    {session.status}
                  </span>
                </div>
                <div className="text-[13px] text-text-muted mb-2">
                  <span className="font-semibold">Flag Reason:</span> {session.reason}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-text-muted">
                  <span className="flex items-center gap-1">
                    <MessageSquare size={10} />
                    {session.messages.length} messages
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(session.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedSession(session)}
                  className="p-2 rounded-lg hover:bg-cream transition-colors"
                  title="View Details">
                  <Eye size={16} className="text-text-muted" />
                </button>
                {session.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleMarkReviewed(session.id)}
                      disabled={actioningId === session.id}
                      className="p-2 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-40"
                      title="Mark Reviewed">
                      <CheckCircle size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={() => handleDismiss(session.id)}
                      disabled={actioningId === session.id}
                      className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                      title="Dismiss">
                      <XCircle size={16} className="text-red-600" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-green-900">Flagged Conversation Review</h3>
              <button
                title="Close"
                onClick={() => setSelectedSession(null)}
                className="p-2 rounded-lg hover:bg-gray-100">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Flag size={14} className="text-red-600" />
                  <span className="text-[13px] font-semibold text-red-800">Flag Reason</span>
                </div>
                <p className="text-[13px] text-red-700">{selectedSession.reason}</p>
              </div>

              {/* Conversation Messages */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-2">
                {selectedSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl ${
                      msg.role === "user"
                        ? "bg-blue-50 ml-auto max-w-[80%]"
                        : "bg-gray-50 mr-auto max-w-[80%]"
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold text-text-muted">
                        {msg.role === "user" ? "Student" : "AI Tutor"}
                      </span>
                      <span className="text-[9px] text-text-muted">{msg.timestamp}</span>
                    </div>
                    <p className="text-[13px] text-green-900">{msg.content}</p>
                    {msg.flagReason && (
                      <div className="mt-2 pt-1 border-t border-red-100">
                        <span className="text-[10px] text-red-600">Flag: {msg.flagReason}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    handleMarkReviewed(selectedSession.id);
                    setSelectedSession(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-green-800 text-white font-semibold hover:bg-green-700">
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => {
                    handleDismiss(selectedSession.id);
                    setSelectedSession(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-text-muted font-semibold hover:bg-gray-50">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="text-2xl font-bold text-green-900">{value}</div>
      <div className="text-[11px] text-text-muted">{label}</div>
    </div>
  );
}
