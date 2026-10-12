"use client";

import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { SettingsSection } from "./types";
import type { AppearanceSettings } from "@/types/settings";

import AdminSettingsSidebar from "./components/AdminSettingsSidebar";
import AdminAppearanceSection from "./components/AdminAppearanceSection";
import PlatformSection from "./components/PlatformSection";
import AdvancedSection from "./components/AdvancedSection";
import BackupSection from "./components/BackupSection";
import IntegrationsSection from "./components/IntegrationsSection";
import NotificationsSection from "./components/NotificationsSection";
import SecuritySection from "./components/SecuritySection";
import * as settingsApi from "@/lib/api/settings";

// Appearance is the admin's own dashboard preference — admins are users
// too, so this reuses the exact same real /users/me/settings endpoint
// and mapper the student Settings page uses (lib/api/settings.ts).
// Platform is real AI-governance config. Everything else here has no
// backend behind it at all — see each component for why.
export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .getSettings()
      .then((backend) => setAppearance(settingsApi.backendToFrontend(backend).appearance))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateAppearance = useCallback(async (v: AppearanceSettings) => {
    const patch = settingsApi.frontendSectionToPatch("appearance", v);
    const updated = await settingsApi.updateSettings(patch);
    setAppearance(settingsApi.backendToFrontend(updated).appearance);
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-black text-gray-900">Platform Settings</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          Configure your admin dashboard and AI governance settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AdminSettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          hasUnsavedChanges={false}
        />

        <div className="lg:col-span-3">
          {activeSection === "appearance" &&
            (loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin text-green-700" />
              </div>
            ) : appearance ? (
              <AdminAppearanceSection settings={appearance} onChange={updateAppearance} />
            ) : null)}
          {activeSection === "platform" && <PlatformSection />}
          {activeSection === "security" && <SecuritySection />}
          {activeSection === "notifications" && <NotificationsSection />}
          {activeSection === "integrations" && <IntegrationsSection />}
          {activeSection === "backup" && <BackupSection />}
          {activeSection === "danger" && <AdvancedSection />}
        </div>
      </div>
    </div>
  );
}
