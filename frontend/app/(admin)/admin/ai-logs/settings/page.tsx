"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, Save, Bell, Shield, Database, RefreshCw, Loader2 } from "lucide-react";
import { AIConfigPanel } from "../components/AIConfigPanel";
import * as aiAdminApi from "@/lib/api/ai-admin";
import type { AiGlobalSettings } from "@/lib/api/ai-admin";
import { extractErrorMessage } from "@/lib/api/client";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500/30 text-green-900";

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border p-6" style={{ borderColor: "rgba(30,80,50,0.08)" }}>
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
          <Icon size={15} className="text-green-700" />
        </div>
        <h3 className="font-serif text-base text-green-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b last:border-0"
      style={{ borderColor: "rgba(30,80,50,0.06)" }}>
      <div>
        <div className="text-[13px] font-medium text-green-900">{label}</div>
        {hint && <div className="text-[11px] text-text-muted mt-0.5">{hint}</div>}
      </div>
      <button
        title="check"
        onClick={() => onChange(!checked)}
        className={`relative rounded-full transition-colors shrink-0 ${checked ? "bg-green-700" : "bg-gray-200"}`}
        style={{ width: 40, height: 22 }}
        aria-pressed={checked}
        aria-label={label}>
        <span
          className="absolute top-0.5 left-0.5 rounded-full bg-white shadow transition-transform"
          style={{
            width: 18,
            height: 18,
            transform: checked ? "translateX(18px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AiGlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await aiAdminApi.getAiSettings());
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = <K extends keyof AiGlobalSettings>(key: K, value: AiGlobalSettings[K]) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await aiAdminApi.updateAiSettings({
        autoFlagThreshold: settings.autoFlagThreshold,
        notifyOnFlagged: settings.notifyOnFlagged,
        monthlyBudgetLimitUsd: settings.monthlyBudgetLimitUsd,
        notifyOnBudgetAlert: settings.notifyOnBudgetAlert,
        notifyEmail: settings.notifyEmail,
        retentionDays: settings.retentionDays,
      });
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-green-700" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error ?? "Couldn't load AI settings."}
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-green-700 text-white text-[13px] font-medium hover:bg-green-800">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center shadow-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-green-900">AI Settings</h1>
            <p className="text-text-muted text-[13px] -mt-0.5">
              Flagging thresholds, budget alerts, and data retention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-cream transition-all text-[13px] text-text-muted">
            <RefreshCw size={14} /> Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-800 text-white text-[13px] font-semibold hover:bg-green-700 transition-all disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Model/temperature defaults intentionally live on the Model
          Management page (per-feature via AiFeatureModelMapping), not
          here — a global "default model" would just be a second,
          conflicting source of truth. */}

      <SectionCard icon={Shield} title="Moderation & Flagging">
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            Auto-Flag Confidence Threshold ({(settings.autoFlagThreshold * 100).toFixed(0)}%)
          </label>
          <input
            title="threshold"
            type="range"
            min={0.5}
            max={1}
            step={0.05}
            value={settings.autoFlagThreshold}
            onChange={(e) => update("autoFlagThreshold", parseFloat(e.target.value))}
            className="w-full accent-amber-600"
          />
          <p className="text-[11px] text-text-muted mt-1">
            AI-graded essay/theory answers with confidence below this are flagged NEEDS_REVIEW
            instead of scored automatically. Applies live, across exam grading and practice scoring.
          </p>
        </div>
        <Toggle
          checked={settings.notifyOnFlagged}
          onChange={(v) => update("notifyOnFlagged", v)}
          label="Notify on flagged answers"
          hint="Raise an admin alert whenever an answer gets flagged for review"
        />
      </SectionCard>

      <SectionCard icon={Bell} title="Budget Alerts">
        <div className="mb-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            Monthly Budget Limit (USD)
          </label>
          <input
            type="number"
            min={0}
            step={1}
            className={inputCls}
            value={settings.monthlyBudgetLimitUsd ?? ""}
            onChange={(e) =>
              update("monthlyBudgetLimitUsd", e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder="Leave blank for no limit"
          />
        </div>
        <Toggle
          checked={settings.notifyOnBudgetAlert}
          onChange={(v) => update("notifyOnBudgetAlert", v)}
          label="Budget alerts"
          hint="A daily check raises an admin alert once this month's AI spend crosses the limit above"
        />
        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            Notification Email
          </label>
          <input
            type="email"
            className={inputCls}
            value={settings.notifyEmail ?? ""}
            onChange={(e) => update("notifyEmail", e.target.value || null)}
            placeholder="admin@gravitest.ng (optional — alerts always show in-app regardless)"
          />
        </div>
      </SectionCard>

      <SectionCard icon={Database} title="Data Retention">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-1">
            Conversation Retention (days)
          </label>
          <input
            title="retention days"
            type="number"
            className={inputCls}
            value={settings.retentionDays ?? ""}
            onChange={(e) => update("retentionDays", e.target.value ? parseInt(e.target.value) : null)}
            min={7}
            max={365}
            placeholder="Leave blank to keep forever"
          />
          <p className="text-[11px] text-text-muted mt-1">
            A weekly job permanently deletes AI conversations older than this. Leave blank to disable
            pruning entirely.
          </p>
        </div>
      </SectionCard>

      {/* Feature Flags */}
      <div>
        <h2 className="font-serif text-lg text-green-900 mb-3">Feature Flags</h2>
        <AIConfigPanel />
      </div>
    </div>
  );
}
