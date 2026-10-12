"use client";

import { useState } from "react";
import { RotateCcw, Info, Command, AlertTriangle, Loader2, X, CheckCircle } from "lucide-react";
import { SettingsCard } from "./ui";
import { DEFAULT_SETTINGS } from "@/lib/constants/settings";
import { AllSettings } from "@/types/settings";

const KEYBOARD_SHORTCUTS = [
  { keys: ["?"], label: "Show all shortcuts" },
  { keys: ["⌘", "K"], label: "Open quick search" },
  { keys: ["⌘", "/"], label: "Toggle sidebar" },
  { keys: ["G", "H"], label: "Go to Dashboard home" },
  { keys: ["G", "P"], label: "Go to Profile" },
  { keys: ["G", "S"], label: "Go to Settings" },
  { keys: ["G", "R"], label: "Go to Practice" },
  { keys: ["G", "L"], label: "Go to Library" },
  { keys: ["G", "G"], label: "Go to Games" },
  { keys: ["Esc"], label: "Close modal / cancel" },
  { keys: ["N"], label: "New practice session" },
];

interface AdvancedSectionProps {
  onResetSettings: () => Promise<void>;
}

export default function AdvancedSection({ onResetSettings }: AdvancedSectionProps) {
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleReset = async () => {
    setIsResetting(true);
    setResetError(null);
    try {
      await onResetSettings();
      setResetDone(true);
      setShowResetModal(false);
      setTimeout(() => setResetDone(false), 3000);
    } catch {
      setResetError("Couldn't reset settings — check your connection and try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      {resetDone && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-[13px] font-semibold text-green-800">
            All settings have been reset to defaults.
          </p>
        </div>
      )}

      {/* Keyboard shortcuts */}
      <SettingsCard
        title="Keyboard Shortcuts"
        description="Quick navigation shortcuts available anywhere in the dashboard">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {KEYBOARD_SHORTCUTS.map(({ keys, label }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[13px] text-gray-700">{label}</span>
              <div className="flex items-center gap-1 shrink-0">
                {keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded-lg text-[11px] font-bold text-gray-700 shadow-sm font-mono">
                      {k}
                    </kbd>
                    {i < keys.length - 1 && (
                      <span className="text-[10px] text-gray-400 mx-0.5">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1.5">
          <Info size={11} />
          Keyboard shortcuts can be disabled in the Accessibility settings.
        </p>
      </SettingsCard>

      {/* App info */}
      <SettingsCard title="App Information">
        <div className="space-y-3">
          {[
            { label: "App Version", value: "1.0.0-beta" },
            { label: "Last Updated", value: "January 2025" },
            { label: "Environment", value: "Production" },
            { label: "Support Email", value: "support@gravitest.ng" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-[13px] text-gray-500">{label}</span>
              <span className="text-[13px] font-semibold text-gray-800">{value}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/privacy"
            className="text-[13px] text-green-600 hover:text-green-700 font-semibold underline underline-offset-2">
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-[13px] text-green-600 hover:text-green-700 font-semibold underline underline-offset-2">
            Terms of Service
          </a>
          <a
            href="/cookies"
            className="text-[13px] text-green-600 hover:text-green-700 font-semibold underline underline-offset-2">
            Cookie Policy
          </a>
        </div>
      </SettingsCard>

      {/* Reset settings */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center">
            <RotateCcw size={18} className="text-amber-700" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-amber-800">Reset All Settings</h3>
            <p className="text-[12px] text-amber-600">
              Restore every setting to its factory default
            </p>
          </div>
        </div>
        <p className="text-[13px] text-amber-700 mb-4 leading-relaxed">
          This will reset your appearance, study preferences, accessibility, language, and privacy
          settings to their defaults. Your profile, sessions, and learning data are not affected.
        </p>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 border-2 border-amber-500 text-amber-700 rounded-xl text-[14px] font-bold hover:bg-amber-100 transition-colors">
          <RotateCcw size={15} />
          Reset to Defaults
        </button>
      </div>

      {/* Reset modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw size={20} className="text-amber-600" />
                <h3 className="text-[17px] font-bold text-gray-900">Reset Settings?</h3>
              </div>
              <button
                title="show reset model"
                onClick={() => setShowResetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-[14px] text-gray-700 mb-3">
                The following will be reset to defaults:
              </p>
              <ul className="space-y-1.5 text-[13px] text-gray-600 mb-5">
                {[
                  "Appearance (theme, colours, layout)",
                  "Study preferences & daily goals",
                  "Accessibility settings",
                  "Language & region",
                  "Privacy settings",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-gray-400">
                Your profile, sessions, and learning data will not be affected.
              </p>
              {resetError && <p className="text-[12px] text-red-500 font-semibold mt-2">{resetError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[14px] font-semibold text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-[2] py-2.5 bg-amber-500 text-white rounded-xl text-[14px] font-bold hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-2">
                {isResetting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <RotateCcw size={15} />
                )}
                {isResetting ? "Resetting…" : "Yes, Reset Everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
