"use client";

import { useEffect } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import {
  FONT_SCALE,
  FONT_SIZE_LABELS,
  useAppearanceStore,
  type FontSizeKey,
  type ThemeMode,
} from "@/lib/theme/appearance-store";

// Shared by the student Settings page and the admin Settings page, so the two
// can't drift apart. Everything here is keyboard operable: each group is a
// radiogroup of real <button>s (Tab to the group, Space/Enter to choose).

/**
 * Show the theme / font size the user is choosing on screen immediately,
 * before they press Save. Cleared on unmount, so leaving without saving
 * snaps back to what is actually saved.
 */
export function useAppearancePreview(theme: ThemeMode, fontSize: FontSizeKey) {
  const setPreview = useAppearanceStore((s) => s.setPreview);
  useEffect(() => {
    setPreview({ theme, fontSize });
  }, [theme, fontSize, setPreview]);
  useEffect(() => () => setPreview(null), [setPreview]);
}

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun; desc: string }[] = [
  { id: "light", label: "Light", icon: Sun, desc: "Bright & clear" },
  { id: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
  { id: "system", label: "System", icon: Monitor, desc: "Follows your device" },
];

export function ThemeModePicker({
  value,
  onChange,
}: {
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3">
      {THEME_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            className={`relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
              active
                ? "border-green-500 bg-green-50"
                : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
            }`}>
            {active && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={11} className="text-white" />
              </div>
            )}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                active ? "bg-green-100" : "bg-gray-200"
              }`}>
              <Icon size={22} className={active ? "text-green-700" : "text-gray-500"} />
            </div>
            <div className="text-center">
              <p className={`text-[13px] font-bold ${active ? "text-green-800" : "text-gray-700"}`}>
                {label}
              </p>
              <p className="text-[11px] text-gray-400">{desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const FONT_OPTIONS: FontSizeKey[] = ["small", "medium", "large", "extra_large"];

export function FontSizePicker({
  value,
  onChange,
}: {
  value: FontSizeKey;
  onChange: (v: FontSizeKey) => void;
}) {
  return (
    <>
      <div role="radiogroup" aria-label="Font size" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {FONT_OPTIONS.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(opt)}
              className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
                active
                  ? "border-green-500 bg-green-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
              }`}>
              {/* fixed px so each tile shows its own size regardless of the current setting */}
              <span
                style={{ fontSize: 18 * FONT_SCALE[opt] }}
                className={`font-bold leading-none ${active ? "text-green-800" : "text-gray-700"}`}>
                Aa
              </span>
              <span className="text-[11px] text-gray-500">{FONT_SIZE_LABELS[opt]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
        <p className="text-sm text-gray-700">
          Preview: &ldquo;The best preparation for tomorrow is doing your best today.&rdquo;
        </p>
      </div>
    </>
  );
}

/** Read-only view of the platform accent for people who can't change it. Uses the live green-* classes, so it always shows the real colour. */
export function AccentReadOnly() {
  return (
    <div>
      <div className="flex overflow-hidden rounded-xl border border-gray-100" aria-hidden="true">
        <div className="h-9 flex-1 bg-green-100" />
        <div className="h-9 flex-1 bg-green-300" />
        <div className="h-9 flex-1 bg-green-500" />
        <div className="h-9 flex-1 bg-green-700" />
        <div className="h-9 flex-1 bg-green-900" />
      </div>
      <p className="text-[11px] text-gray-400 mt-3">
        The accent colour is chosen by your platform administrator and applies to everyone.
      </p>
    </div>
  );
}
