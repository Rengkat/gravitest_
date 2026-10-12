"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  Bell,
  Smartphone,
  Star,
  Calendar,
  TrendingUp,
  BookOpen,
  Trophy,
  Save,
  Loader2,
} from "lucide-react";
import * as notificationsApi from "@/lib/api/notifications";
import { extractErrorMessage } from "@/lib/api/client";

// Maps directly onto UserNotificationPreferences columns on the backend
// (src/notifications/entities/user-notification-preferences.entity.ts) —
// dropped the old mock's "Marketing & Offers" toggle since there's no
// backing field for it there; showing a toggle with nothing behind it
// would be worse than not showing it.
type PrefKey =
  | "emailEnabled"
  | "pushEnabled"
  | "smsEnabled"
  | "examReminders"
  | "achievementAlerts"
  | "leaderboardUpdates"
  | "weeklyReports"
  | "newContentAlerts";

const NOTIFICATION_ITEMS: {
  id: PrefKey;
  label: string;
  description: string;
  icon: any;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    id: "emailEnabled",
    label: "Email Notifications",
    description: "Receive important updates via email",
    icon: Mail,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 border-blue-100",
  },
  {
    id: "pushEnabled",
    label: "Push Notifications",
    description: "Browser and app push alerts",
    icon: Bell,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-50 border-purple-100",
  },
  {
    id: "smsEnabled",
    label: "SMS Notifications",
    description: "Text message alerts to your phone",
    icon: Smartphone,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 border-emerald-100",
  },
  {
    id: "examReminders",
    label: "Exam Reminders",
    description: "Reminders about upcoming exams and sessions",
    icon: Calendar,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50 border-amber-100",
  },
  {
    id: "achievementAlerts",
    label: "Achievement Alerts",
    description: "Get notified when you earn badges or XP",
    icon: Star,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-50 border-yellow-100",
  },
  {
    id: "leaderboardUpdates",
    label: "Leaderboard Updates",
    description: "When your rank changes on the leaderboard",
    icon: Trophy,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50 border-orange-100",
  },
  {
    id: "weeklyReports",
    label: "Weekly Progress Report",
    description: "A summary of your learning each week",
    icon: TrendingUp,
    iconColor: "text-green-600",
    iconBg: "bg-green-50 border-green-100",
  },
  {
    id: "newContentAlerts",
    label: "New Resource Alerts",
    description: "When new study materials are added",
    icon: BookOpen,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-50 border-indigo-100",
  },
];

export default function NotificationsSection() {
  const [settings, setSettings] = useState<Record<PrefKey, boolean> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const prefs = (await notificationsApi.getPreferences()) as Record<string, unknown>;
      setSettings({
        emailEnabled: !!prefs.emailEnabled,
        pushEnabled: !!prefs.pushEnabled,
        smsEnabled: !!prefs.smsEnabled,
        examReminders: !!prefs.examReminders,
        achievementAlerts: !!prefs.achievementAlerts,
        leaderboardUpdates: !!prefs.leaderboardUpdates,
        weeklyReports: !!prefs.weeklyReports,
        newContentAlerts: !!prefs.newContentAlerts,
      });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: PrefKey) => {
    if (!settings) return;
    setSettings((prev) => (prev ? { ...prev, [id]: !prev[id] } : prev));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await notificationsApi.updatePreferences(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-green-600" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-[13px] text-red-600 mb-3">{error ?? "Couldn't load preferences."}</p>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-green-700 text-white text-[13px] font-medium hover:bg-green-800">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold text-gray-900">Notification Preferences</h3>
          <p className="text-[12px] text-gray-500 mt-0.5">Choose how and when you receive alerts</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-60 ${
            saved
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
              : "bg-green-600 text-white hover:bg-green-700 shadow-sm"
          }`}>
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? "Saved!" : "Save"}
        </button>
      </div>

      <div className="space-y-1">
        {NOTIFICATION_ITEMS.map(({ id, label, description, icon: Icon, iconColor, iconBg }) => (
          <div
            key={id}
            className="flex items-center justify-between py-3.5 px-1 border-b border-gray-50 last:border-0 group">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${iconBg}`}>
                <Icon size={16} className={iconColor} />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-gray-800">{label}</p>
                <p className="text-[12px] text-gray-500 truncate">{description}</p>
              </div>
            </div>

            <button
              onClick={() => toggle(id)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ml-4 ${
                settings[id] ? "bg-green-600" : "bg-gray-200"
              }`}
              aria-label={label}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  settings[id] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
