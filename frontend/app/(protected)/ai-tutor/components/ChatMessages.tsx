"use client";

import type { RefObject } from "react";
import type { Message } from "@/types/ai-tutor";
import { SUGGESTIONS } from "@/lib/mock/ai-tutor";
import MessageBubble from "./MessageBubble";

interface ChatMessagesProps {
  messages: Message[];
  onFeedback: (id: string, feedback: "like" | "dislike") => void;
  onSendSuggestion: (text: string) => void;
  bottomRef: RefObject<HTMLDivElement | null>;
}

export default function ChatMessages({
  messages,
  onFeedback,
  onSendSuggestion,
  bottomRef,
}: ChatMessagesProps) {
  return (
    <main
      aria-label="Chat messages"
      aria-live="polite"
      aria-atomic="false"
      className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} onFeedback={onFeedback} />
      ))}

      {messages.length === 1 && (
        <div style={{ animation: "fadeUp 0.5s 0.3s ease both" }}>
          <p className="text-[12px] text-text-light font-mono tracking-[0.06em] uppercase mb-2.5">
            Try asking…
          </p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
            {SUGGESTIONS.slice(0, 6).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSendSuggestion(s)}
                className="px-3.5 py-2.5 rounded-xl text-left bg-white border border-cream-border text-[13px] text-text-muted cursor-pointer hover:bg-cream-dark hover:border-green-200 transition-all font-sans leading-snug focus-visible:outline-2 focus-visible:outline-green-500">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </main>
  );
}
