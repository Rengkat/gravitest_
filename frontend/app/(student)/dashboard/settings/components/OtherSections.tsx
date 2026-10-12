"use client";

import { useState } from "react";
import { AccessibilitySettings, LanguageSettings, PrivacySettings } from "@/types/settings";
import { LANGUAGES, TIMEZONES } from "@/lib/constants/settings";
import {
  SettingsCard,
  ToggleRow,
  SettingsSelect,
  SettingsGroupLabel,
  SaveBar,
  ChipGroup,
} from "./ui";
import { Eye, Globe, Lock } from "lucide-react";

// ── Accessibility ─────────────────────────────────────────────────────────

export function AccessibilitySection({
  settings,
  onChange,
}: {
  settings: AccessibilitySettings;
  onChange: (s: AccessibilitySettings) => Promise<void>;
}) {
  const [local, setLocal] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  const update = <K extends keyof AccessibilitySettings>(key: K, val: AccessibilitySettings[K]) => {
    setLocal((p) => ({ ...p, [key]: val }));
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
      <SettingsCard
        title="Motion & Visuals"
        description="Adjust visual effects to reduce strain or improve focus">
        <ToggleRow
          label="Reduce Motion"
          description="Minimise animations, transitions, and parallax effects"
          value={local.reduceMotion}
          onChange={(v) => update("reduceMotion", v)}
        />
        <ToggleRow
          label="High Contrast Mode"
          description="Increase colour contrast for better readability"
          value={local.highContrast}
          onChange={(v) => update("highContrast", v)}
        />
        <ToggleRow
          label="Enhanced Focus Indicator"
          description="Display a more visible outline when navigating with keyboard"
          value={local.focusIndicatorEnhanced}
          onChange={(v) => update("focusIndicatorEnhanced", v)}
        />
      </SettingsCard>

      <SettingsCard
        title="Colour Vision"
        description="Apply a colour filter optimised for colour blindness">
        <div className="space-y-2">
          {(
            [
              { id: "none", label: "None (Default)" },
              { id: "protanopia", label: "Protanopia (Red-blind)" },
              { id: "deuteranopia", label: "Deuteranopia (Green-blind)" },
              { id: "tritanopia", label: "Tritanopia (Blue-blind)" },
            ] as const
          ).map(({ id, label }) => {
            const active = local.colorBlindMode === id;
            return (
              <button
                key={id}
                onClick={() => update("colorBlindMode", id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span
                  className={`text-[13px] font-semibold ${active ? "text-green-800" : "text-gray-700"}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Input & Navigation">
        <ToggleRow
          label="Larger Click Targets"
          description="Increase button and link tap areas for easier interaction"
          value={local.largerClickTargets}
          onChange={(v) => update("largerClickTargets", v)}
        />
        <ToggleRow
          label="Keyboard Shortcuts"
          description="Enable keyboard shortcuts for common actions (press ? to view all)"
          value={local.keyboardShortcutsEnabled}
          onChange={(v) => update("keyboardShortcutsEnabled", v)}
        />
        <ToggleRow
          label="Screen Reader Optimised"
          description="Improve compatibility with assistive technology and screen readers"
          value={local.screenReaderOptimized}
          onChange={(v) => update("screenReaderOptimized", v)}
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

// ── Language & Region ─────────────────────────────────────────────────────

export function LanguageSection({
  settings,
  onChange,
}: {
  settings: LanguageSettings;
  onChange: (s: LanguageSettings) => Promise<void>;
}) {
  const [local, setLocal] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  const update = <K extends keyof LanguageSettings>(key: K, val: LanguageSettings[K]) => {
    setLocal((p) => ({ ...p, [key]: val }));
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
      <SettingsCard
        title="Language"
        description="Set your preferred language for the app interface and content">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SettingsSelect
            label="App Language"
            value={local.appLanguage as any}
            onChange={(v) => update("appLanguage", v)}
            options={LANGUAGES}
            hint="Language for menus, buttons, and UI text"
          />
          <SettingsSelect
            label="Content Language"
            value={local.contentLanguage as any}
            onChange={(v) => update("contentLanguage", v)}
            options={LANGUAGES}
            hint="Language for study materials and questions"
          />
        </div>
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-[12px] text-amber-700">
            <span className="font-bold">Coming soon:</span> Yorùbá, Igbo, and Hausa interfaces are
            currently in development.
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title="Date, Time & Region">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SettingsSelect
            label="Date Format"
            value={local.dateFormat}
            onChange={(v) => update("dateFormat", v)}
            options={[
              { id: "dd/mm/yyyy", label: "DD/MM/YYYY (e.g. 20/01/2025)" },
              { id: "mm/dd/yyyy", label: "MM/DD/YYYY (e.g. 01/20/2025)" },
              { id: "yyyy-mm-dd", label: "YYYY-MM-DD (ISO, e.g. 2025-01-20)" },
            ]}
          />
          <div>
            <label className="block text-[12px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Time Format
            </label>
            <ChipGroup
              options={["12h", "24h"] as const}
              value={local.timeFormat}
              onChange={(v) => update("timeFormat", v)}
              renderLabel={(v) => (v === "12h" ? "12-hour (2:30 PM)" : "24-hour (14:30)")}
            />
          </div>
          <SettingsSelect
            label="Timezone"
            value={local.timezone as any}
            onChange={(v) => update("timezone", v)}
            options={TIMEZONES}
          />
          <SettingsSelect
            label="Currency"
            value={local.currency}
            onChange={(v) => update("currency", v)}
            options={[
              { id: "NGN", label: "₦ Nigerian Naira (NGN)" },
              { id: "USD", label: "$ US Dollar (USD)" },
              { id: "GBP", label: "£ British Pound (GBP)" },
            ]}
          />
        </div>
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

// ── Privacy ───────────────────────────────────────────────────────────────

export function PrivacySection({
  settings,
  onChange,
}: {
  settings: PrivacySettings;
  onChange: (s: PrivacySettings) => Promise<void>;
}) {
  const [local, setLocal] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = JSON.stringify(local) !== JSON.stringify(settings);

  const update = <K extends keyof PrivacySettings>(key: K, val: PrivacySettings[K]) => {
    setLocal((p) => ({ ...p, [key]: val }));
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
      <SettingsCard
        title="Profile Visibility"
        description="Control who can find and view your profile">
        <div className="space-y-2">
          {(
            [
              {
                id: "public",
                label: "Public",
                desc: "Anyone on Gravitest can see your profile and stats",
              },
              {
                id: "friends",
                label: "Friends",
                desc: "Only students you follow can see your full profile",
              },
              { id: "private", label: "Private", desc: "Only you can see your profile" },
            ] as const
          ).map(({ id, label, desc }) => {
            const active = local.profileVisibility === id;
            return (
              <button
                key={id}
                onClick={() => update("profileVisibility", id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                  active
                    ? "border-green-500 bg-green-50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-green-500 bg-green-500" : "border-gray-300"}`}>
                  {active && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div>
                  <p
                    className={`text-[13px] font-bold ${active ? "text-green-800" : "text-gray-700"}`}>
                    {label}
                  </p>
                  <p className="text-[11px] text-gray-400">{desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Social & Community">
        <ToggleRow
          label="Show in Leaderboard"
          description="Allow your username and score to appear on public leaderboards"
          value={local.showInLeaderboard}
          onChange={(v) => update("showInLeaderboard", v)}
        />
        <ToggleRow
          label="Show Online Status"
          description="Let classmates see when you're active"
          value={local.showOnlineStatus}
          onChange={(v) => update("showOnlineStatus", v)}
        />
      </SettingsCard>

      <SettingsCard title="Data & Tracking">
        <ToggleRow
          label="Activity Tracking"
          description="Allow Gravitest to track your study patterns to improve recommendations"
          value={local.activityTracking}
          onChange={(v) => update("activityTracking", v)}
        />
        <ToggleRow
          label="Personalised Advertising"
          description="Use your learning data to show relevant adverts"
          value={local.personalizedAds}
          onChange={(v) => update("personalizedAds", v)}
        />
        <ToggleRow
          label="Share Data with Partners"
          description="Share anonymised usage data with educational research partners"
          value={local.dataSharedWithPartners}
          onChange={(v) => update("dataSharedWithPartners", v)}
        />
        <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-xl">
          <p className="text-[12px] text-blue-700">
            We never sell your personal data. Read our{" "}
            <a href="/privacy" className="font-bold underline hover:text-blue-900">
              Privacy Policy
            </a>{" "}
            to learn exactly what we collect and why.
          </p>
        </div>
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
