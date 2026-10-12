"use client";

import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { SettingsSection, AllSettings } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/lib/constants/settings";
import * as settingsApi from "@/lib/api/settings";
import { extractErrorMessage } from "@/lib/api/client";

import SettingsSidebar from "./SettingsSidebar";
import AppearanceSection from "./AppearanceSection";
import StudySection from "./StudySection";
import { AccessibilitySection, LanguageSection, PrivacySection } from "./OtherSections";
import DataSection from "./DataSection";
import IntegrationsSection from "./IntegrationsSection";
import AdvancedSection from "./AdvancedSection";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [settings, setSettings] = useState<AllSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((backend) => setSettings(settingsApi.backendToFrontend(backend)))
      .catch((err) => setLoadError(extractErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Dirty tracking — any section that has a pending save bar will mark this
  // We track globally here for the sidebar badge
  const [dirtySection, setDirtySection] = useState<SettingsSection | null>(null);

  // Persists just the changed section to the backend, then reconciles the
  // full local state from the server's authoritative response — so if the
  // server coerces/validates a value, the UI reflects what actually got
  // saved rather than what was optimistically typed.
  const updateSection = useCallback(
    async <K extends keyof AllSettings>(key: K, val: AllSettings[K]) => {
      const patch = settingsApi.frontendSectionToPatch(key, val);
      const updated = await settingsApi.updateSettings(patch);
      setSettings(settingsApi.backendToFrontend(updated));
      setDirtySection(null);
    },
    [],
  );

  const handleResetAll = useCallback(async () => {
    const patch = {
      ...settingsApi.frontendSectionToPatch("appearance", DEFAULT_SETTINGS.appearance),
      ...settingsApi.frontendSectionToPatch("study", DEFAULT_SETTINGS.study),
      ...settingsApi.frontendSectionToPatch("accessibility", DEFAULT_SETTINGS.accessibility),
      ...settingsApi.frontendSectionToPatch("language", DEFAULT_SETTINGS.language),
      ...settingsApi.frontendSectionToPatch("privacy", DEFAULT_SETTINGS.privacy),
    };
    const updated = await settingsApi.updateSettings(patch);
    setSettings(settingsApi.backendToFrontend(updated));
    setDirtySection(null);
  }, []);

  return (
    /* Lives inside the dashboard layout — no outer shell needed */
    <div className="max-w-6xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[24px] font-black text-gray-900">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Customise your Gravitest experience — appearance, study preferences, privacy, and more
        </p>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-[13px] text-red-700">
            Couldn&apos;t load your saved settings ({loadError}) — showing defaults. Any changes
            you make now will still try to save.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* ── Sidebar ── */}
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          hasUnsavedChanges={dirtySection !== null}
        />

        {/* ── Content ── */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={28} className="animate-spin text-green-600" />
            </div>
          ) : (
            <>
              {activeSection === "appearance" && (
                <AppearanceSection
                  settings={settings.appearance}
                  onChange={(v) => updateSection("appearance", v)}
                />
              )}

              {activeSection === "study" && (
                <StudySection settings={settings.study} onChange={(v) => updateSection("study", v)} />
              )}

              {activeSection === "accessibility" && (
                <AccessibilitySection
                  settings={settings.accessibility}
                  onChange={(v) => updateSection("accessibility", v)}
                />
              )}

              {activeSection === "language" && (
                <LanguageSection
                  settings={settings.language}
                  onChange={(v) => updateSection("language", v)}
                />
              )}

              {activeSection === "privacy" && (
                <PrivacySection
                  settings={settings.privacy}
                  onChange={(v) => updateSection("privacy", v)}
                />
              )}

              {activeSection === "data" && <DataSection settings={settings} />}

              {activeSection === "integrations" && <IntegrationsSection />}

              {activeSection === "danger" && <AdvancedSection onResetSettings={handleResetAll} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
