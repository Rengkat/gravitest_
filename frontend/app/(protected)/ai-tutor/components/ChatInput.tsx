"use client";

import { useRef, useEffect, type RefObject, type KeyboardEvent } from "react";
import { Send, Mic, MicOff, Settings, Loader2 } from "lucide-react";
import type { Difficulty, ResponseStyle } from "@/types/ai-tutor";
import SettingsPanel from "./SettingsPanel";

interface ChatInputProps {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  toggleRecording: () => void;
  onSend: () => void;
  subjectName: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  // settings
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  difficulty: Difficulty;
  setDifficulty: (v: Difficulty) => void;
  responseStyle: ResponseStyle;
  setResponseStyle: (v: ResponseStyle) => void;
  pidgin: boolean;
  setPidgin: (v: boolean) => void;
}

export default function ChatInput({
  input,
  setInput,
  isLoading,
  isRecording,
  toggleRecording,
  onSend,
  subjectName,
  inputRef,
  settingsOpen,
  setSettingsOpen,
  difficulty,
  setDifficulty,
  responseStyle,
  setResponseStyle,
  pidgin,
  setPidgin,
}: ChatInputProps) {
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        settingsBtnRef.current &&
        !settingsBtnRef.current.closest("[data-settings-container]")?.contains(target)
      ) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [settingsOpen, setSettingsOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="px-5 pt-3 pb-4 bg-white shrink-0">
      <div className="flex items-end gap-2.5 bg-white border-[1.5px] border-green-500/[0.18] rounded-2xl px-3 py-2.5 transition-all shadow-[0_2px_12px_rgba(13,43,26,0.05)] focus-within:border-green-800 focus-within:shadow-[0_0_0_3px_rgba(26,74,46,0.08)]">
        <label htmlFor="chat-input" className="sr-only">
          Message Sabi-Tutor about {subjectName}
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${subjectName}… (Enter to send, Shift+Enter for new line)`}
          rows={1}
          disabled={isLoading}
          aria-label={`Ask about ${subjectName}`}
          aria-describedby="chat-hint"
          className="flex-1 border-none outline-none resize-none text-[14px] text-text-main bg-transparent leading-relaxed min-h-[22px] max-h-[140px] overflow-y-auto font-sans placeholder:text-text-main/30 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={toggleRecording}
          aria-label={isRecording ? "Stop voice recording" : "Start voice input"}
          title={isRecording ? "Stop recording" : "Voice input"}
          className={`shrink-0 w-[34px] h-[34px] rounded-lg flex items-center justify-center border-none cursor-pointer transition-all focus-visible:outline-2 focus-visible:outline-green-500 ${
            isRecording
              ? "bg-red-500/10 text-red-500"
              : "bg-green-800/[0.07] text-text-muted hover:bg-green-800/[0.12]"
          }`}>
          {isRecording ? (
            <MicOff size={16} aria-hidden="true" />
          ) : (
            <Mic size={16} aria-hidden="true" />
          )}
        </button>

        <div className="relative shrink-0" data-settings-container>
          <button
            type="button"
            ref={settingsBtnRef}
            onClick={() => setSettingsOpen((o) => !o)}
            aria-label="Open tutor settings"
            title="Tutor settings"
            className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center border-none cursor-pointer text-text-muted transition-all focus-visible:outline-2 focus-visible:outline-green-500 ${
              settingsOpen ? "bg-green-800/[0.12]" : "bg-green-800/[0.07] hover:bg-green-800/[0.12]"
            }`}>
            <Settings size={15} aria-hidden="true" />
          </button>
          {settingsOpen && (
            <SettingsPanel
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              style={responseStyle}
              setStyle={setResponseStyle}
              pidgin={pidgin}
              setPidgin={setPidgin}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!input.trim() || isLoading}
          data-testid="send-btn"
          aria-label={isLoading ? "Sending message…" : "Send message"}
          className={`shrink-0 h-[34px] px-4 rounded-lg border-none font-bold text-[13px] flex items-center gap-1.5 transition-all font-sans focus-visible:outline-2 focus-visible:outline-green-400 ${
            input.trim() && !isLoading
              ? "bg-green-800 text-white cursor-pointer hover:bg-green-700"
              : "bg-green-800/20 text-green-800/40 cursor-not-allowed"
          }`}>
          {isLoading ? (
            <Loader2
              size={15}
              aria-hidden="true"
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Send size={15} aria-hidden="true" />
          )}
          <span>{isLoading ? "Thinking…" : "Send"}</span>
        </button>
      </div>

      <p id="chat-hint" className="text-[11px] text-text-light text-center mt-2 font-mono">
        Sabi-Tutor can make mistakes. Verify important answers in your textbook.
      </p>
    </div>
  );
}
