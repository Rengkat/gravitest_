"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { WELCOME_MESSAGE } from "@/lib/constants/ai-tutor";
import type { Conversation, Difficulty, Message, ResponseStyle, Subject } from "@/types/ai-tutor";
import {
  streamTutorMessage,
  listTutorConversations,
  getTutorConversation,
  type TutorDifficulty,
  type TutorResponseStyle,
  type AiConversationDto,
} from "@/lib/api/aiTutor";
import { extractErrorMessage } from "@/lib/api/client";
import { tutorErrorContent } from "./tutorError";

interface UseChatOptions {
  selectedSubject: Subject;
  difficulty: Difficulty;
  responseStyle: ResponseStyle;
  pidgin: boolean;
}

// Frontend has a couple of extra options the backend's enums don't model
// 1:1 yet — mapped to the closest real value rather than sent as-is
// (which would fail @IsEnum validation).
function toBackendDifficulty(d: Difficulty): TutorDifficulty {
  return d === "expert" ? "advanced" : d;
}
function toBackendStyle(s: ResponseStyle): TutorResponseStyle {
  return s === "step-by-step" ? "detailed" : s;
}

function mapConversation(dto: AiConversationDto): Conversation {
  return {
    id: dto.id,
    title: dto.title ?? "New conversation",
    lastMessage: "",
    timestamp: new Date(dto.lastActivityAt ?? dto.updatedAt),
    messageCount: dto.messageCount,
    subject: (dto.subject as Subject) ?? "general",
  };
}

export function useChat({ selectedSubject, difficulty, responseStyle, pidgin }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load real conversation history on mount
  useEffect(() => {
    listTutorConversations()
      .then((list) => setConversations(list.map(mapConversation)))
      .catch(() => {
        // Non-fatal — sidebar just starts empty.
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [input]);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const convo = await getTutorConversation(conversationId);
      setMessages(
        convo.messages.map((m) => ({
          id: m.id,
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
          timestamp: new Date(m.createdAt),
        })),
      );
      setActiveConversationId(conversationId);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  }, []);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isLoading) return;

      setInput("");
      setIsLoading(true);

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
        subject: selectedSubject,
      };

      const streamingId = `${Date.now() + 1}`;
      const streamingMsg: Message = {
        id: streamingId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        subject: selectedSubject,
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, streamingMsg]);

      try {
        let fullText = "";
        let newConversationId: string | undefined;

        for await (const chunk of streamTutorMessage({
          conversationId: activeConversationId ?? undefined,
          message: content,
          subject: selectedSubject === "general" ? undefined : selectedSubject,
          difficulty: toBackendDifficulty(difficulty),
          style: toBackendStyle(responseStyle),
          pidgin,
        })) {
          if (chunk.error) throw new Error(chunk.error);
          if (chunk.conversationId) newConversationId = chunk.conversationId;
          fullText += chunk.delta;
          setMessages((prev) =>
            prev.map((m) => (m.id === streamingId ? { ...m, content: fullText } : m)),
          );
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === streamingId ? { ...m, streaming: false } : m)),
        );

        if (newConversationId && newConversationId !== activeConversationId) {
          setActiveConversationId(newConversationId);
          // Refresh the sidebar so the new/updated conversation shows up.
          listTutorConversations()
            .then((list) => setConversations(list.map(mapConversation)))
            .catch(() => {});
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId
              ? { ...m, content: tutorErrorContent(err), streaming: false }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, selectedSubject, difficulty, responseStyle, pidgin, activeConversationId],
  );

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setActiveConversationId(null);
  }, []);

  // Local-only — no backend endpoint for per-message like/dislike today,
  // only whole-conversation rating (rateTutorConversation). Kept as
  // lightweight UI state rather than blocked on a backend feature that
  // isn't part of the core tutor flow.
  const handleFeedback = useCallback((id: string, feedback: "like" | "dislike") => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, feedback } : m)));
  }, []);

  return {
    messages,
    input,
    setInput,
    isLoading,
    conversations,
    activeConversationId,
    loadConversation,
    sendMessage,
    clearChat,
    handleFeedback,
    bottomRef,
    inputRef,
  };
}
