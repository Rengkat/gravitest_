import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Difficulty, ResponseStyle } from "@/types/ai-tutor";

interface SettingsPanelProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  style: ResponseStyle;
  setStyle: (s: ResponseStyle) => void;
  pidgin: boolean;
  setPidgin: (p: boolean) => void;
  onClose: () => void;
}

export default function SettingsPanel({
  difficulty,
  setDifficulty,
  style,
  setStyle,
  pidgin,
  setPidgin,
  onClose,
}: SettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const switchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    switchRef.current?.setAttribute("aria-checked", String(pidgin));
  }, [pidgin]);

  /* Focus the close button when panel opens */
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  /* Keyboard: close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      id="settings-panel"
      ref={panelRef}
      role="dialog"
      aria-label="Tutor settings"
      aria-modal="true"
      className="absolute bottom-[calc(100%+8px)] right-0 w-[280px] bg-white rounded-2xl border border-cream-border shadow-[0_12px_40px_rgba(13,43,26,0.15)] p-5 z-50"
      style={{ animation: "fadeUp 0.2s ease both" }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[14px] font-bold text-green-900">Tutor settings</span>
        <button
          ref={closeBtnRef}
          onClick={onClose}
          aria-label="Close settings"
          title="Close"
          className="border-none bg-transparent cursor-pointer text-text-light hover:text-text-muted p-0.5 rounded transition-colors focus-visible:outline-2 focus-visible:outline-green-500">
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-col gap-3.5">
        {/* Difficulty */}
        <div>
          <label
            htmlFor="difficulty-select"
            className="block text-[11px] font-bold text-text-muted tracking-[0.08em] uppercase font-mono mb-1.5">
            Difficulty level
          </label>
          <select
            id="difficulty-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2 rounded-lg border-[1.5px] border-green-500/15 bg-white text-[13px] font-sans text-text-main outline-none cursor-pointer focus-visible:border-green-800 focus-visible:shadow-[0_0_0_3px_rgba(26,74,46,0.1)] transition-all">
            <option value="beginner">🟢 Beginner (Simple)</option>
            <option value="intermediate">🟡 Intermediate (SS2/SS3)</option>
            <option value="advanced">🟠 Advanced (JAMB/WAEC)</option>
            <option value="expert">🔴 Expert (University)</option>
          </select>
        </div>

        {/* Response style */}
        <div>
          <label
            htmlFor="style-select"
            className="block text-[11px] font-bold text-text-muted tracking-[0.08em] uppercase font-mono mb-1.5">
            Response style
          </label>
          <select
            id="style-select"
            value={style}
            onChange={(e) => setStyle(e.target.value as ResponseStyle)}
            className="w-full px-3 py-2 rounded-lg border-[1.5px] border-green-500/15 bg-white text-[13px] font-sans text-text-main outline-none cursor-pointer focus-visible:border-green-800 focus-visible:shadow-[0_0_0_3px_rgba(26,74,46,0.1)] transition-all">
            <option value="detailed">📖 Detailed explanation</option>
            <option value="concise">⚡ Concise &amp; to the point</option>
            <option value="step-by-step">🔢 Step by step</option>
            <option value="examples">💡 Lead with examples</option>
          </select>
        </div>

        {/* Pidgin toggle */}
        <div
          ref={switchRef}
          role="switch"
          aria-checked="false"
          aria-label="Toggle Pidgin mode — mix English with Naija Pidgin"
          tabIndex={0}
          onClick={() => setPidgin(!pidgin)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setPidgin(!pidgin);
            }
          }}
          className={`flex items-center justify-between px-3 py-2.5 rounded-lg border-[1.5px] cursor-pointer transition-all select-none focus-visible:outline-2 focus-visible:outline-green-500 ${
            pidgin
              ? "bg-green-800/[0.05] border-green-500/20"
              : "bg-black/[0.02] border-green-500/12 hover:bg-green-800/[0.03]"
          }`}>
          <div>
            <div className="text-[13px] font-semibold text-green-900">🇳🇬 Pidgin mode</div>
            <div className="text-[11px] text-text-muted mt-0.5">Mix English with Naija Pidgin</div>
          </div>

          {/* Toggle thumb */}
          <div
            aria-hidden="true"
            className={`w-9 h-5 rounded-full relative transition-colors ${
              pidgin ? "bg-green-800" : "bg-green-500/25"
            }`}>
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                pidgin ? "left-[18px]" : "left-0.5"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
