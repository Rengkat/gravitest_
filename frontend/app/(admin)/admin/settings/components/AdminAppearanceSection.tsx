"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AppearanceSettings, DashboardLayout } from "@/types/settings";
import { SettingsCard, ToggleRow, SaveBar } from "./ui";
import PlatformAccentCard from "./PlatformAccentCard";
import {
  FontSizePicker,
  ThemeModePicker,
  useAppearancePreview,
} from "@/Components/appearance/AppearanceControls";

interface AdminAppearanceSectionProps {
  settings: AppearanceSettings;
  onChange: (s: AppearanceSettings) => Promise<void>;
}

const LAYOUT_OPTIONS: { id: DashboardLayout; label: string; desc: string; preview: string }[] = [
  { id: "compact", label: "Compact", desc: "More content, less spacing", preview: "░░░░░░░░" },
  {
    id: "comfortable",
    label: "Comfortable",
    desc: "Balanced spacing (default)",
    preview: "░░░  ░░░",
  },
  { id: "spacious", label: "Spacious", desc: "Generous breathing room", preview: "░░    ░░" },
];

export default function AdminAppearanceSection({
  settings,
  onChange,
}: AdminAppearanceSectionProps) {
  const [local, setLocal] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  // Theme and font size take effect on screen as soon as they are picked.
  useAppearancePreview(local.theme, local.fontSize);

  const update = <K extends keyof AppearanceSettings>(key: K, val: AppearanceSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await onChange(local);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save — check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Platform accent — admin-controlled, applies to every user */}
      <PlatformAccentCard />

      {/* Theme (personal) */}
      <SettingsCard title="Admin Theme" description="Choose how the admin dashboard looks for you">
        <ThemeModePicker value={local.theme} onChange={(v) => update("theme", v)} />
        <p className="text-[11px] text-gray-400 mt-3">
          System follows your device setting. This only changes your own view.
        </p>
      </SettingsCard>

      {/* Font size (personal) */}
      <SettingsCard title="Font Size" description="Adjust the text size across the admin panel for you">
        <FontSizePicker value={local.fontSize} onChange={(v) => update("fontSize", v)} />
      </SettingsCard>

      {/* Dashboard layout */}
      <SettingsCard
        title="Admin Layout"
        description="Control the spacing density of the admin dashboard">
        <div className="grid grid-cols-3 gap-3">
          {LAYOUT_OPTIONS.map(({ id, label, desc, preview }) => {
            const active = local.dashboardLayout === id;
            return (
              <button
                key={id}
                onClick={() => update("dashboardLayout", id)}
                className={`relative flex flex-col gap-2.5 p-4 rounded-2xl border-2 text-left transition-all ${
                  active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white"
                }`}>
                {active && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={9} className="text-white" />
                  </div>
                )}
                <div className="font-mono text-[18px] text-gray-400 tracking-widest">{preview}</div>
                <div>
                  <p
                    className={`text-[13px] font-bold ${active ? "text-green-800" : "text-gray-700"}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400 leading-tight">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      {/* Display Options */}
      <SettingsCard title="Display Options">
        <ToggleRow
          label="Show Animations"
          description="Enable transitions and micro-animations throughout the admin panel"
          value={local.showAnimations}
          onChange={(v) => update("showAnimations", v)}
        />
        <ToggleRow
          label="Show Avatar in Header"
          description="Display your profile picture in the top navigation bar"
          value={local.showAvatarInHeader}
          onChange={(v) => update("showAvatarInHeader", v)}
        />
        <ToggleRow
          label="Collapse Sidebar by Default"
          description="Start with the admin sidebar minimised"
          value={local.sidebarCollapsed}
          onChange={(v) => update("sidebarCollapsed", v)}
        />
        <SaveBar
          visible={isDirty || saved}
          onSave={handleSave}
          onDiscard={() => {
            setLocal(settings);
            setSaved(false);
            setError(null);
          }}
          isSaving={isSaving}
          saved={saved}
          error={error}
        />
      </SettingsCard>
    </div>
  );
}
