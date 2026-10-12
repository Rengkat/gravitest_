import { ThumbsDown, ThumbsUp, User } from "lucide-react";
import { Message } from "@/types/ai-tutor";
import TypingDots from "./TypingDots";
import CopyButton from "./CopyButton";
import SubjectChip from "./SubjectChip";
import renderMarkdown from "./RenderMarkdown";
import { useEffect, useRef } from "react";

interface MessageBubbleProps {
  msg: Message;
  onFeedback: (id: string, f: "like" | "dislike") => void;
}

export default function MessageBubble({ msg, onFeedback }: MessageBubbleProps) {
  const isUser = msg.role === "user";
  const likeRef = useRef<HTMLButtonElement>(null);
  const dislikeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    likeRef.current?.setAttribute("aria-pressed", String(msg.feedback === "like"));
    dislikeRef.current?.setAttribute("aria-pressed", String(msg.feedback === "dislike"));
  }, [msg.feedback]);
  return (
    <div
      data-testid={`message-${msg.id}`}
      role="article"
      aria-label={`${isUser ? "Your" : "Sabi-Tutor"} message`}
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      style={{ animation: "msgIn 0.25s cubic-bezier(0.16,1,0.3,1) both" }}>
      {/* Avatar */}
      {isUser ? (
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full shrink-0 bg-green-800/[0.12] border-[1.5px] border-green-800/20 flex items-center justify-center mt-0.5">
          <User size={16} className="text-green-600" />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="w-8 h-8 rounded-full shrink-0 bg-green-800 flex items-center justify-center mt-0.5">
          <span className="font-serif text-base text-gold leading-none">G</span>
        </div>
      )}

      {/* Bubble + meta */}
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 text-[14px] leading-relaxed ${
            isUser
              ? "bg-green-800 text-white/92 rounded-[18px_4px_18px_18px] shadow-[0_4px_16px_rgba(26,74,46,0.2)]"
              : "bg-white text-text-main rounded-[4px_18px_18px_18px] border border-green-500/[0.1] shadow-[0_2px_12px_rgba(13,43,26,0.06)]"
          } font-sans`}>
          {msg.streaming ? (
            <TypingDots />
          ) : isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div className="flex flex-col gap-0.5">{renderMarkdown(msg.content)}</div>
          )}
        </div>

        {/* Meta row: timestamp, subject, actions */}
        <div
          className={`flex items-center gap-1.5 px-1 flex-wrap ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <time
            dateTime={msg.timestamp.toISOString()}
            className="text-[11px] text-text-light font-mono">
            {msg.timestamp.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
          </time>

          {msg.subject && msg.subject !== "general" && !isUser && (
            <SubjectChip subject={msg.subject} />
          )}

          {!isUser && !msg.streaming && (
            <>
              <CopyButton text={msg.content} />

              <button
                ref={likeRef}
                type="button"
                onClick={() => onFeedback(msg.id, "like")}
                aria-label="Mark as helpful"
                title="Helpful"
                className={`p-1 border-none bg-transparent cursor-pointer flex items-center transition-colors rounded focus-visible:outline-2 focus-visible:outline-green-500 ${
                  msg.feedback === "like"
                    ? "text-green-500"
                    : "text-text-light hover:text-green-500"
                }`}>
                <ThumbsUp size={13} aria-hidden="true" />
              </button>

              <button
                ref={dislikeRef}
                type="button"
                onClick={() => onFeedback(msg.id, "dislike")}
                aria-label="Mark as not helpful"
                title="Not helpful"
                className={`p-1 border-none bg-transparent cursor-pointer flex items-center transition-colors rounded focus-visible:outline-2 focus-visible:outline-green-500 ${
                  msg.feedback === "dislike" ? "text-red-500" : "text-text-light hover:text-red-400"
                }`}>
                <ThumbsDown size={13} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
