"use client";

import {
  User,
  Bot,
  Clock,
  Hash,
  Tag,
  Flag,
  Star,
  AlertTriangle,
  CheckCircle,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import type { AISessionDetail } from "../../components/AISessionDetails";
import {
  FEATURE_LABELS,
  FEATURE_COLORS,
  MODEL_LABELS,
  MODEL_PROVIDERS,
  formatTokens,
  formatCost,
  formatDuration,
} from "../../components/AISessionDetails";
import { MessageBubble } from "./MessageBubble";

interface Props {
  session: AISessionDetail;
  onFlag?: (id: string, reason: string) => void;
  onDismissFlag?: (id: string) => void;
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-2 py-2 border-b last:border-0"
      style={{ borderColor: "rgba(30,80,50,0.06)" }}>
      <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={11} className="text-green-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <div className="text-[12px] font-medium text-green-900 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export function ConversationDetail({ session, onFlag, onDismissFlag }: Props) {
  const featureCfg = FEATURE_COLORS[session.feature];
  const userTokens = session.messages
    .filter((m) => m.role === "user")
    .reduce((s, m) => s + (m.tokens ?? 0), 0);
  const aiTokens = session.messages
    .filter((m) => m.role === "assistant")
    .reduce((s, m) => s + (m.tokens ?? 0), 0);
  const responseTimes = session.messages
    .filter((m) => m.role === "assistant" && m.responseTime)
    .map((m) => m.responseTime as number);
  const avgResponseTime = responseTimes.length
    ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-5 items-start">
      <div
        className="bg-white rounded-2xl border overflow-hidden"
        style={{ borderColor: "rgba(30,80,50,0.08)" }}>
        <div
          className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-[11px] font-bold shrink-0">
              {session.userName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-green-900">{session.userName}</span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: featureCfg.bg, color: featureCfg.color }}>
                  {FEATURE_LABELS[session.feature]}
                </span>
                {session.isFlagged && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold">
                    <Flag size={9} /> Flagged
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted">{session.userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session.isFlagged && onDismissFlag && (
              <button
                onClick={() => onDismissFlag(session.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-[12px] font-medium hover:bg-green-100 transition-all">
                <CheckCircle size={12} /> Dismiss Flag
              </button>
            )}
            {!session.isFlagged && onFlag && (
              <button
                onClick={() => onFlag(session.id, "Manual review")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-[12px] font-medium hover:bg-red-100 transition-all">
                <Flag size={12} /> Flag Session
              </button>
            )}
          </div>
        </div>

        {session.isFlagged && session.flagReason && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2 text-[12px] text-red-700">
            <AlertTriangle size={14} className="shrink-0" />
            <strong>Flag reason:</strong> {session.flagReason}
          </div>
        )}

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {session.messages.length === 0 ? (
            <p className="text-center text-[13px] text-text-muted py-8">No messages recorded.</p>
          ) : (
            session.messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isFlagged={session.isFlagged && msg.role === "user"}
              />
            ))
          )}
        </div>

        {session.userRating != null && (
          <div
            className="px-5 py-3 border-t bg-amber-50/50"
            style={{ borderColor: "rgba(30,80,50,0.06)" }}>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={13}
                    className={
                      s <= session.userRating!
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200"
                    }
                  />
                ))}
              </div>
              <span className="font-semibold text-green-900">{session.userRating}/5</span>
              {session.userFeedback && (
                <span className="text-text-muted">— "{session.userFeedback}"</span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div
          className="bg-white rounded-2xl border p-4"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
            Session Stats
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: "Messages", value: session.messageCount },
              { label: "Duration", value: formatDuration(session.startTime, session.endTime) },
              { label: "Total Tokens", value: formatTokens(session.totalTokens) },
              { label: "Total Cost", value: formatCost(session.totalCost) },
              { label: "User Tokens", value: formatTokens(userTokens) },
              { label: "AI Tokens", value: formatTokens(aiTokens) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-cream rounded-lg p-2">
                <div className="text-[13px] font-bold text-green-900">{value}</div>
                <div className="text-[9px] text-text-muted">{label}</div>
              </div>
            ))}
          </div>
          {avgResponseTime && (
            <div className="text-[11px] text-text-muted text-center">
              Avg response: <strong className="text-green-900">{avgResponseTime}ms</strong>
            </div>
          )}
        </div>

        <div
          className="bg-white rounded-2xl border p-4"
          style={{ borderColor: "rgba(30,80,50,0.08)" }}>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
            Session Info
          </h3>
          <MetaItem
            icon={Hash}
            label="Session ID"
            value={<span className="font-mono text-[10px]">{session.sessionId}</span>}
          />
          <MetaItem icon={User} label="User" value={session.userName} />
          <MetaItem icon={Tag} label="Feature" value={FEATURE_LABELS[session.feature]} />
          <MetaItem
            icon={Bot}
            label="Model"
            value={`${MODEL_LABELS[session.model]} (${MODEL_PROVIDERS[session.model]})`}
          />
          {session.subject && <MetaItem icon={BookOpen} label="Subject" value={session.subject} />}
          {session.topic && <MetaItem icon={Tag} label="Topic" value={session.topic} />}
          {session.examType && <MetaItem icon={GraduationCap} label="Exam" value={session.examType} />}
          <MetaItem
            icon={Clock}
            label="Started"
            value={new Date(session.startTime).toLocaleString("en-NG")}
          />
          {session.endTime && (
            <MetaItem
              icon={Clock}
              label="Ended"
              value={new Date(session.endTime).toLocaleString("en-NG")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
