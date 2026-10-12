"use client";

import { useState } from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import type { AIMessage } from "../../types";
import { formatCost } from "../../components/AISessionDetails";

interface Props {
  message: AIMessage;
  isFlagged?: boolean;
  flagReason?: string;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isFlagged, flagReason }: Props) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const copy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="px-3 py-1.5 rounded-full bg-gray-100 text-[10px] text-text-muted max-w-sm text-center">
          <span className="font-semibold">System:</span> {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""} group`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? "bg-blue-100" : "bg-green-100"
        }`}>
        {isUser ? (
          <User size={13} className="text-blue-600" />
        ) : (
          <Bot size={13} className="text-green-700" />
        )}
      </div>

      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {isFlagged && flagReason && (
          <div className="px-2.5 py-1 rounded-t-lg bg-red-50 border border-red-200 text-[10px] text-red-600 font-semibold w-full">
            {flagReason}
          </div>
        )}

        <div
          className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed relative whitespace-pre-line ${
            isUser
              ? "bg-green-800 text-white rounded-tr-sm"
              : "bg-white border text-green-900 rounded-tl-sm"
          } ${isFlagged ? "border-2 border-red-300" : ""}`}
          style={!isUser ? { borderColor: "rgba(30,80,50,0.1)" } : undefined}>
          {message.content}

          <button
            onClick={copy}
            className={`absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all ${
              isUser ? "hover:bg-white/20" : "hover:bg-cream"
            }`}
            aria-label="Copy message">
            {copied ? (
              <Check size={11} className={isUser ? "text-white" : "text-green-600"} />
            ) : (
              <Copy size={11} className={isUser ? "text-white/70" : "text-text-muted"} />
            )}
          </button>
        </div>

        <div
          className={`flex items-center gap-2 text-[10px] text-text-muted ${isUser ? "flex-row-reverse" : ""}`}>
          <span>{fmtTime(message.timestamp)}</span>
          {message.tokens != null && <span>{message.tokens} tokens</span>}
          {message.cost != null && <span>{formatCost(message.cost)}</span>}
          {message.responseTime != null && !isUser && <span>{message.responseTime}ms</span>}
        </div>
      </div>
    </div>
  );
}
